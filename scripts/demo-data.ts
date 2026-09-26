/**
 * Demo dataset for showing the CRM (sales demos, screenshots, training): about 60 realistic leads in the default
 * organization with calls, follow-ups (overdue, due today, upcoming), site visits, bookings, notes and complete
 * timelines, spread over the last eight weeks and today.
 *
 *   npm run db:demo              # add the dataset (refuses when it is already there)
 *   npm run db:demo -- --drop    # remove every demo record again
 *   npm run db:demo -- --dry-run # build everything in a transaction, report, and roll back
 *
 * Demo leads carry the tag "demo-data" and the source detail "Demo data". Rows are written directly in one
 * transaction (like the load test), numbered from the organization's sequences, then the daily statistics are
 * rebuilt so dashboards and reports include them. Refuses to run with NODE_ENV=production.
 */
import { randomUUID } from "node:crypto";

import { ACTIVITY_TYPES } from "@/modules/activities/constants";
import { refreshDailyStats } from "@/modules/analytics/server/aggregates";
import { ASSIGNMENT_ACTIVITY_TYPES } from "@/modules/assignment/constants";
import { DEAL_TYPES } from "@/modules/deals/constants";
import { LEAD_ACTIVITY_TYPES } from "@/modules/leads/constants";
import { prisma } from "@/platform/db/client";
import { createTenantDb } from "@/platform/db/tenant-scope";
import { formatSequenceNumber, nextSequenceValue } from "@/platform/sequences";

const TAG = "demo-data";
const DRY_RUN = process.argv.includes("--dry-run");
class DryRun extends Error {}
const SUB_SOURCE = "Demo data";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Demo schedules are laid out in Indian working hours. */
const IST_OFFSET = 330 * 60_000;

// --- Deterministic randomness (same dataset on every run) ---------------------------------------------------------

let seed = 20260926;
function random() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(list: readonly T[]): T => list[Math.floor(random() * list.length)]!;
const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const chance = (probability: number) => random() < probability;

const FIRST_NAMES = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Arjun",
  "Rohan",
  "Karan",
  "Siddharth",
  "Nikhil",
  "Pranav",
  "Rahul",
  "Ananya",
  "Diya",
  "Ishita",
  "Kavya",
  "Meera",
  "Neha",
  "Pooja",
  "Riya",
  "Sneha",
  "Tanvi",
  "Farhan",
  "Imran",
  "Zoya",
  "Sara",
  "Gurpreet",
  "Harpreet",
  "Joseph",
  "Maria",
  "Venkat",
  "Lakshmi",
];
const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Iyer",
  "Nair",
  "Patel",
  "Shah",
  "Mehta",
  "Kulkarni",
  "Deshpande",
  "Joshi",
  "Reddy",
  "Rao",
  "Khan",
  "Qureshi",
  "Singh",
  "Gill",
  "Fernandes",
  "D'Souza",
  "Banerjee",
  "Chatterjee",
];
const LOCALITIES: Record<string, string[]> = {
  Mumbai: ["Andheri West", "Powai", "Goregaon East", "Malad West", "Bandra East", "Chembur"],
  Pune: ["Kharadi", "Viman Nagar", "Hinjewadi", "Baner", "Wakad", "Magarpatta"],
  Nashik: ["Gangapur Road", "College Road", "Indira Nagar", "Pathardi Phata"],
};
const NOTES = [
  "Wants a 2 BHK close to the metro; wife prefers a higher floor.",
  "Relocating from Bengaluru in March — needs possession within a year.",
  "Budget is firm; open to a smaller carpet area for a better location.",
  "Investor, already owns two flats — interested in rental yield.",
  "Parents will join the site visit; needs pickup from Thane station.",
  "Comparing with a Godrej project nearby; price is the deciding factor.",
  "Asked for the payment plan and the builder's past delivery record.",
  "Prefers east-facing units; will decide after the Diwali offers.",
];
const CALL_NOTES = [
  "Shared the brochure on WhatsApp.",
  "Discussed budget and loan eligibility.",
  "Customer asked to call back in the evening.",
  "Interested in the sample flat; wants to visit this weekend.",
  "Explained the payment plan and possession timeline.",
];
const VISIT_FEEDBACK = [
  "Liked the amenities and the view from the 18th floor.",
  "Happy with the layout; negotiating on the floor-rise charges.",
  "Found the location a bit far from the office.",
  "Wants to bring the family for a second look.",
];

/** Status path to each final status; the lead walks it from creation to today. */
const PATHS: Record<string, string[]> = {
  NEW: ["NEW"],
  ASSIGNED: ["NEW", "ASSIGNED"],
  CONTACTED: ["NEW", "ASSIGNED", "CONTACTED"],
  POSITIVE: ["NEW", "ASSIGNED", "CONTACTED", "POSITIVE"],
  FOLLOW_UP: ["NEW", "ASSIGNED", "CONTACTED", "FOLLOW_UP"],
  CALLBACK: ["NEW", "ASSIGNED", "CONTACTED", "CALLBACK"],
  UNRESPONSIVE: ["NEW", "ASSIGNED", "UNRESPONSIVE"],
  NEGATIVE: ["NEW", "ASSIGNED", "CONTACTED", "NEGATIVE"],
  VISIT: ["NEW", "ASSIGNED", "CONTACTED", "POSITIVE", "VISIT"],
  REVISIT: ["NEW", "ASSIGNED", "CONTACTED", "POSITIVE", "VISIT", "REVISIT"],
  BOOKING: ["NEW", "ASSIGNED", "CONTACTED", "POSITIVE", "VISIT", "BOOKING"],
  CLOSED_WON: ["NEW", "ASSIGNED", "CONTACTED", "POSITIVE", "VISIT", "BOOKING", "CLOSED_WON"],
  NOT_INTERESTED: ["NEW", "ASSIGNED", "CONTACTED", "NOT_INTERESTED"],
  LOST: ["NEW", "ASSIGNED", "CONTACTED", "POSITIVE", "VISIT", "LOST"],
};
/** How many demo leads end in each status (about 60 in all). */
const PLAN: [string, number][] = [
  ["NEW", 4],
  ["ASSIGNED", 6],
  ["CONTACTED", 6],
  ["POSITIVE", 6],
  ["FOLLOW_UP", 6],
  ["CALLBACK", 3],
  ["UNRESPONSIVE", 3],
  ["NEGATIVE", 2],
  ["VISIT", 7],
  ["REVISIT", 3],
  ["BOOKING", 4],
  ["CLOSED_WON", 4],
  ["NOT_INTERESTED", 3],
  ["LOST", 3],
];
const CONTACTED_KEYS = new Set(["CONTACTED", "POSITIVE", "FOLLOW_UP", "CALLBACK", "NEGATIVE"]);

async function organizationId(): Promise<string> {
  const slug = process.env.DEFAULT_ORGANIZATION_SLUG ?? "default";
  const organization = await prisma.organization.findUnique({ where: { slug } });
  if (!organization)
    throw new Error(`Organization "${slug}" not found — run the database seed first.`);
  return organization.id;
}

async function timezoneOf(orgId: string): Promise<string> {
  const settings = await prisma.organizationSetting.findUnique({
    where: { organizationId: orgId },
  });
  return (settings as { timezone?: string } | null)?.timezone ?? "Asia/Kolkata";
}

async function rebuildStats(orgId: string) {
  const db = createTenantDb(orgId);
  const timezone = await timezoneOf(orgId);
  const today = new Date();
  const from = new Date(today.getTime() - 70 * DAY).toISOString().slice(0, 10);
  const rows = await refreshDailyStats(db, orgId, {
    from,
    to: today.toISOString().slice(0, 10),
    timezone,
  });
  console.log(`✔ daily statistics rebuilt (${rows} rows)`);
}

async function demoLeadIds(orgId: string): Promise<string[]> {
  const leads = await prisma.lead.findMany({
    where: { organizationId: orgId, OR: [{ tags: { has: TAG } }, { subSource: SUB_SOURCE }] },
    select: { id: true },
  });
  return leads.map((lead) => lead.id);
}

// --- Drop ---------------------------------------------------------------------------------------------------------

async function drop(orgId: string) {
  const leadIds = await demoLeadIds(orgId);
  if (!leadIds.length) return console.log("No demo data to remove.");
  const bookingIds = (
    await prisma.booking.findMany({
      where: { organizationId: orgId, leadId: { in: leadIds } },
      select: { id: true },
    })
  ).map((booking) => booking.id);
  const columns = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name IN ('lead_id', 'booking_id') AND table_name <> 'leads'`;
  const targets = [
    ...columns.map((column) => ({
      table: column.table_name,
      column: column.column_name,
      ids: column.column_name === "lead_id" ? leadIds : bookingIds,
    })),
    { table: "leads", column: "id", ids: leadIds },
  ].filter((target) => target.ids.length);
  await prisma.$transaction(
    async (tx) => {
      // Children first; tables that still have dependants are retried in the next pass (savepoints keep the
      // transaction usable after a blocked delete).
      let pending = targets;
      for (let pass = 0; pass < 8 && pending.length; pass += 1) {
        const blocked: typeof targets = [];
        for (const target of pending) {
          await tx.$executeRawUnsafe(`SAVEPOINT demo_drop`);
          try {
            await tx.$executeRawUnsafe(
              `DELETE FROM "${target.table}" WHERE "organization_id" = $1::uuid AND "${target.column}" = ANY($2::uuid[])`,
              orgId,
              target.ids,
            );
            await tx.$executeRawUnsafe(`RELEASE SAVEPOINT demo_drop`);
          } catch {
            await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT demo_drop`);
            blocked.push(target);
          }
        }
        pending = blocked;
      }
      if (pending.length) {
        throw new Error(
          `Could not remove demo rows from: ${pending.map((target) => target.table).join(", ")} ` +
            "(records created on top of the demo data still point to them).",
        );
      }
    },
    { timeout: 10 * 60_000, maxWait: 30_000 },
  );
  console.log(`✔ removed ${leadIds.length} demo leads and everything recorded on them`);
  await rebuildStats(orgId);
}

// --- Seed ---------------------------------------------------------------------------------------------------------

async function add(orgId: string) {
  if ((await demoLeadIds(orgId)).length) {
    console.log("Demo data is already there. Run with --drop first to recreate it.");
    return;
  }
  const where = { organizationId: orgId };
  const [
    statuses,
    sources,
    outcomes,
    purposes,
    visitOutcomes,
    stages,
    lossReasons,
    projects,
    propertyTypes,
    configurations,
    members,
  ] = await Promise.all([
    prisma.leadStatus.findMany({ where }),
    prisma.leadSource.findMany({ where: { ...where, isActive: true } }),
    prisma.callOutcome.findMany({ where: { ...where, isActive: true } }),
    prisma.followUpPurpose.findMany({ where: { ...where, isActive: true } }),
    prisma.visitOutcome.findMany({
      where: { ...where, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.bookingStage.findMany({
      where: { ...where, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.lossReason.findMany({ where: { ...where, isActive: true } }),
    prisma.project.findMany({ where: { ...where, isActive: true }, include: { builder: true } }),
    prisma.propertyType.findMany({ where }),
    prisma.configurationType.findMany({ where }),
    prisma.membership.findMany({
      where: { ...where, status: "ACTIVE" },
      include: { user: true, role: true },
    }),
  ]);
  const status = (key: string) => {
    const found = statuses.find((entry) => entry.key === key);
    if (!found) throw new Error(`Lead status ${key} is missing — run the database seed.`);
    return found;
  };
  if (!projects.length) throw new Error("No active projects — add at least one project first.");
  if (!outcomes.length) throw new Error("No call outcomes — run the database seed.");
  const admin = members.find((member) => member.role.key === "admin") ?? members[0]!;
  const owners = members.filter((member) => ["executive", "manager"].includes(member.role.key));
  if (!owners.length) throw new Error("No executives or managers to own the demo leads.");
  const connected = outcomes.filter((outcome) => outcome.connected);
  const notConnected = outcomes.filter((outcome) => !outcome.connected);
  const bhk = configurations.filter((entry) => /BHK/i.test(entry.name));
  const apartment =
    propertyTypes.find((entry) => /apartment|flat/i.test(entry.name)) ?? propertyTypes[0];
  const now = Date.now();
  const ownerPool = owners.some((member) => member.id === admin.id)
    ? owners
    : [...owners, ...owners, admin];
  const istHourNow = new Date(now + IST_OFFSET).getUTCHours();
  /** A quarter-hour between `fromHour` and `toHour` (IST), `days` from today. */
  const workSlot = (days: number, fromHour = 10, toHour = 18) => {
    const local = new Date(now + IST_OFFSET + days * DAY);
    local.setUTCHours(between(fromHour, toHour), pick([0, 15, 30, 45]), 0, 0);
    return new Date(local.getTime() - IST_OFFSET);
  };
  /** Later today when the working day allows it, otherwise tomorrow. */
  const laterToday = (toHour = 19) =>
    istHourNow + 1 <= toHour ? workSlot(0, istHourNow + 1, toHour) : workSlot(1, 10, 12);
  const past = (ms: number) => new Date(Math.min(ms, now - 5 * 60_000));
  /** Squeezes a moment into office hours (09:30–19:30 IST) of its day, keeping events in order. */
  const office = (ms: number) => {
    const local = ms + IST_OFFSET;
    const day = Math.floor(local / DAY) * DAY;
    return past(day + 9.5 * HOUR + ((local - day) / DAY) * 10 * HOUR - IST_OFFSET);
  };
  const quarterHour = (at: Date) =>
    new Date(Math.floor(at.getTime() / (15 * 60_000)) * 15 * 60_000);

  const leads: Record<string, unknown>[] = [];
  const interests: Record<string, unknown>[] = [];
  const activities: Record<string, unknown>[] = [];
  const history: Record<string, unknown>[] = [];
  const assignments: Record<string, unknown>[] = [];
  const calls: Record<string, unknown>[] = [];
  const followUps: Record<string, unknown>[] = [];
  const visits: Record<string, unknown>[] = [];
  const bookings: Record<string, unknown>[] = [];
  const notes: Record<string, unknown>[] = [];

  await createTenantDb(orgId)
    .$transaction(
      async (tx) => {
        const ctx = { organizationId: orgId };
        let index = 0;
        for (const [finalKey, count] of PLAN) {
          for (let n = 0; n < count; n += 1, index += 1) {
            const id = randomUUID();
            const number = formatSequenceNumber("LD", await nextSequenceValue(tx, ctx, "lead"));
            const first = pick(FIRST_NAMES);
            const name = `${first} ${pick(LAST_NAMES)}`;
            const mobileDigits = `9${between(100000000, 999999999)}`;
            const project = pick(projects);
            const city = project.city ?? "Mumbai";
            const locality = pick(LOCALITIES[city] ?? LOCALITIES.Mumbai!);
            const source = pick(sources);
            const path = PATHS[finalKey]!;
            // The admin owns a few leads too, so every demo login has an agenda.
            const owner = finalKey === "NEW" ? null : pick(ownerPool);
            const ownerName = owner?.user.name ?? null;
            // Later stages started longer ago; every lead has a few hours between steps.
            const ageDays =
              finalKey === "NEW"
                ? between(0, 2)
                : Math.min(56, path.length * between(3, 7) + between(0, 6));
            // Moments are spread over the lead's life, then placed in office hours (`office`).
            const createdRaw = now - ageDays * DAY - between(1, 8) * HOUR;
            const createdAt = office(createdRaw);
            const span = Math.max(now - createdRaw - 2 * HOUR, HOUR);
            const stepRaw = (step: number) => createdRaw + (span * step) / path.length;
            const stepAt = (step: number) => office(stepRaw(step));
            const lastStepRaw = stepRaw(path.length - 1);
            const budgetMin = pick([45, 60, 75, 90, 110, 140, 180]) * 100_000;
            const temperature = ["BOOKING", "CLOSED_WON", "VISIT", "REVISIT"].includes(finalKey)
              ? "HOT"
              : ["POSITIVE", "FOLLOW_UP", "CALLBACK"].includes(finalKey)
                ? "WARM"
                : pick(["COLD", "WARM", null]);
            const actor = { actorType: "USER", actorId: admin.userId, actorName: admin.user.name };
            const activity = (
              type: string,
              summary: string,
              occurredAt: Date,
              payload: object = {},
              by = actor,
            ) =>
              activities.push({
                id: randomUUID(),
                organizationId: orgId,
                leadId: id,
                type,
                summary,
                payload,
                occurredAt,
                ...by,
              });
            const ownerActor = owner
              ? { actorType: "USER", actorId: owner.userId, actorName: owner.user.name }
              : actor;

            activity(LEAD_ACTIVITY_TYPES.CREATED, `Lead ${number} created manually`, createdAt, {
              channel: "MANUAL",
              source: source.name,
              projects: [project.name],
            });
            interests.push({
              organizationId: orgId,
              leadId: id,
              projectId: project.id,
              level: temperature === "HOT" ? "HIGH" : "MEDIUM",
              createdAt,
            });

            // Status path, assignment, calls and follow-ups along the way.
            let lastContactedAt: Date | null = null;
            let lastCallAt: Date | null = null;
            let lastOutcomeId: string | null = null;
            let callAttempts = 0;
            let firstVisitAt: Date | null = null;
            let bookedAt: Date | null = null;
            let closedAt: Date | null = null;
            let lostAt: Date | null = null;
            let lossReasonId: string | null = null;
            let statusChangedAt = createdAt;
            let lastActivityAt = createdAt;
            const touch = (at: Date) => {
              if (at > lastActivityAt) lastActivityAt = at;
            };
            const logCall = (at: Date, reached: boolean, by = owner) => {
              const outcome = reached
                ? pick(connected)
                : pick(notConnected.length ? notConnected : connected);
              const callId = randomUUID();
              const duration = reached ? between(45, 600) : 0;
              const note = reached && chance(0.6) ? pick(CALL_NOTES) : null;
              calls.push({
                id: callId,
                organizationId: orgId,
                leadId: id,
                callerId: by?.id ?? null,
                callerName: by?.user.name ?? admin.user.name,
                direction: chance(0.85) ? "OUTBOUND" : "INBOUND",
                startedAt: at,
                durationSeconds: duration,
                connected: outcome.connected,
                outcomeId: outcome.id,
                notes: note,
                createdAt: at,
              });
              const minutes = duration ? ` · ${Math.floor(duration / 60)}m ${duration % 60}s` : "";
              activity(
                ACTIVITY_TYPES.CALL_LOGGED,
                `Outgoing call · ${outcome.label}${minutes}${note ? `: ${note}` : ""}`,
                at,
                {
                  callId,
                  direction: "OUTBOUND",
                  startedAt: at.toISOString(),
                  durationSeconds: duration,
                  connected: outcome.connected,
                  outcome: { id: outcome.id, label: outcome.label, category: outcome.category },
                  notes: note,
                },
                by ? { actorType: "USER", actorId: by.userId, actorName: by.user.name } : actor,
              );
              lastCallAt = at;
              lastOutcomeId = outcome.id;
              if (outcome.connected) {
                lastContactedAt = at;
                callAttempts = 0;
              } else callAttempts += 1;
              touch(at);
              return callId;
            };

            for (let step = 1; step < path.length; step += 1) {
              const at = stepAt(step);
              const from = status(path[step - 1]!);
              const to = status(path[step]!);
              if (path[step] === "ASSIGNED" && owner) {
                assignments.push({
                  id: randomUUID(),
                  organizationId: orgId,
                  leadId: id,
                  kind: "ASSIGN",
                  method: "MANUAL",
                  assigneeId: owner.id,
                  assignedById: admin.id,
                  assignedByName: admin.user.name,
                  assignedAt: at,
                });
                activity(ASSIGNMENT_ACTIVITY_TYPES.ASSIGNED, `Assigned to ${ownerName}`, at, {
                  assignee: { id: owner.id, name: ownerName },
                  method: "MANUAL",
                });
              }
              if (path[step] === "CONTACTED") {
                if (chance(0.5)) logCall(office(stepRaw(step) - 3 * HOUR), false);
                logCall(at, true);
              }
              if (path[step] === "UNRESPONSIVE") {
                for (let attempt = 0; attempt < between(3, 5); attempt += 1) {
                  logCall(office(stepRaw(step) - (4 - attempt) * 5 * HOUR), false);
                }
              }
              if (
                ["POSITIVE", "FOLLOW_UP", "CALLBACK", "NEGATIVE", "NOT_INTERESTED"].includes(
                  path[step]!,
                )
              ) {
                logCall(at, true);
              }
              if (path[step] === "VISIT" || path[step] === "REVISIT") {
                const isRevisit = path[step] === "REVISIT";
                const outcome = visitOutcomes.length ? pick(visitOutcomes) : null;
                const feedback = pick(VISIT_FEEDBACK);
                const visitId = randomUUID();
                visits.push({
                  id: visitId,
                  organizationId: orgId,
                  leadId: id,
                  projectId: project.id,
                  builderId: project.builderId,
                  number: 1,
                  isRevisit,
                  scheduledAt: quarterHour(at),
                  status: "COMPLETED",
                  assignedToId: owner?.id ?? null,
                  createdById: owner?.id ?? null,
                  createdByName: ownerName ?? admin.user.name,
                  conductedById: owner?.id ?? null,
                  conductedByName: ownerName,
                  completedAt: at,
                  outcomeId: outcome?.id ?? null,
                  feedback,
                  createdAt: new Date(at.getTime() - 2 * DAY),
                });
                const label = isRevisit ? "Revisit 1" : "Visit 1";
                activity(
                  DEAL_TYPES.VISIT_COMPLETED,
                  `${label} to ${project.name} done${outcome ? ` · ${outcome.label}` : ""}: ${feedback}`,
                  at,
                  {
                    visitId,
                    number: 1,
                    isRevisit,
                    project: { id: project.id, name: project.name },
                    outcome: outcome
                      ? { id: outcome.id, label: outcome.label, category: outcome.category }
                      : null,
                  },
                  ownerActor,
                );
                if (!firstVisitAt) firstVisitAt = at;
              }
              if (path[step] === "BOOKING") {
                bookedAt = at;
                const bookingNumber = formatSequenceNumber(
                  "BK",
                  await nextSequenceValue(tx, ctx, "booking"),
                );
                const value = (budgetMin / 100_000 + between(5, 40)) * 100_000;
                const won = finalKey === "CLOSED_WON";
                const bookingClosedAt = won ? stepAt(step + 1) : null;
                bookings.push({
                  id: randomUUID(),
                  organizationId: orgId,
                  number: bookingNumber,
                  leadId: id,
                  projectId: project.id,
                  builderId: project.builderId,
                  executiveId: owner!.id,
                  managerId: owner!.reportsToId,
                  customerName: name,
                  tower: pick(["A", "B", "C"]),
                  floor: String(between(3, 22)),
                  unitNumber: `${between(3, 22)}0${between(1, 4)}`,
                  configurationTypeId: bhk.length ? pick(bhk).id : null,
                  bookingDate: new Date(at.toISOString().slice(0, 10)),
                  agreementValue: value,
                  tokenAmount: Math.round(value * 0.05),
                  status: won ? "CLOSED_WON" : "ACTIVE",
                  stageId: stages.length ? (won ? stages.at(-1)!.id : stages[0]!.id) : null,
                  createdById: owner!.id,
                  createdByName: ownerName!,
                  closedAt: bookingClosedAt,
                  closedByName: won ? ownerName : null,
                  createdAt: at,
                });
                activity(
                  DEAL_TYPES.BOOKING_CREATED,
                  `Booking ${bookingNumber} created for ${project.name}`,
                  at,
                  {},
                  ownerActor,
                );
                if (won && bookingClosedAt) {
                  closedAt = bookingClosedAt;
                  activity(
                    DEAL_TYPES.BOOKING_CLOSED,
                    `Booking ${bookingNumber} closed as won`,
                    bookingClosedAt,
                    {},
                    ownerActor,
                  );
                }
              }
              if (path[step] === "NOT_INTERESTED" || path[step] === "LOST") {
                const scope = path[step] === "LOST" ? "LOST" : "NOT_INTERESTED";
                const reasons = lossReasons.filter((reason) => reason.appliesTo.includes(scope));
                lossReasonId = reasons.length ? pick(reasons).id : null;
                lostAt = at;
              }
              history.push({
                id: randomUUID(),
                organizationId: orgId,
                leadId: id,
                fromStatusId: from.id,
                toStatusId: to.id,
                changedById: (owner ?? admin).userId,
                changedByName: (owner ?? admin).user.name,
                changedAt: at,
              });
              activity(
                LEAD_ACTIVITY_TYPES.STATUS_CHANGED,
                `Changed status: ${from.label} → ${to.label}`,
                at,
                {
                  from: { key: from.key, label: from.label, color: from.color },
                  to: { key: to.key, label: to.label, color: to.color },
                  reason: null,
                  reopened: false,
                },
                owner ? ownerActor : actor,
              );
              statusChangedAt = at;
              touch(at);
            }
            if (finalKey === "ASSIGNED" && chance(0.5)) {
              for (let attempt = 0; attempt < between(1, 2); attempt += 1) {
                logCall(office(createdRaw + (attempt + 1) * 3 * HOUR), false);
              }
            }

            // The next step: open follow-ups (overdue, today, upcoming) for leads still being worked, and upcoming visits.
            const open = !["NEW", "CLOSED_WON", "NOT_INTERESTED", "LOST", "NEGATIVE"].includes(
              finalKey,
            );
            let nextFollowUpAt: Date | null = null;
            if (open && owner) {
              if (
                CONTACTED_KEYS.has(finalKey) ||
                ["VISIT", "REVISIT", "BOOKING"].includes(finalKey)
              ) {
                const done = office(lastStepRaw - 20 * HOUR);
                if (done > createdAt) {
                  followUps.push({
                    id: randomUUID(),
                    organizationId: orgId,
                    leadId: id,
                    type: "FOLLOW_UP",
                    status: "COMPLETED",
                    assignedToId: owner.id,
                    dueAt: done,
                    purposeId: purposes.length ? pick(purposes).id : null,
                    createdById: owner.id,
                    createdByName: owner.user.name,
                    completedAt: done,
                    completedById: owner.id,
                    completedByName: owner.user.name,
                    createdAt: new Date(done.getTime() - DAY),
                  });
                  activity(
                    ACTIVITY_TYPES.FOLLOW_UP_COMPLETED,
                    "Follow-up done",
                    done,
                    {},
                    ownerActor,
                  );
                }
              }
              const roll = random();
              const due =
                roll < 0.25
                  ? workSlot(-between(1, 2))
                  : roll < 0.5
                    ? laterToday()
                    : roll < 0.9
                      ? workSlot(between(1, 6))
                      : null;
              if (due) {
                const type = finalKey === "CALLBACK" ? "CALLBACK" : "FOLLOW_UP";
                const scheduledAt = office(Math.min(lastStepRaw + HOUR, now - HOUR));
                followUps.push({
                  id: randomUUID(),
                  organizationId: orgId,
                  leadId: id,
                  type,
                  status: "SCHEDULED",
                  assignedToId: owner.id,
                  dueAt: due,
                  purposeId: purposes.length ? pick(purposes).id : null,
                  createdById: owner.id,
                  createdByName: owner.user.name,
                  missedAt:
                    due.getTime() < now - 2 * HOUR ? new Date(due.getTime() + 2 * HOUR) : null,
                  createdAt: scheduledAt,
                });
                activity(
                  ACTIVITY_TYPES.FOLLOW_UP_SCHEDULED,
                  `${type === "CALLBACK" ? "Callback" : "Follow-up"} scheduled`,
                  scheduledAt,
                  { type, dueAt: due.toISOString() },
                  ownerActor,
                );
                nextFollowUpAt = due;
              }
              if ((finalKey === "POSITIVE" || finalKey === "FOLLOW_UP") && chance(0.6)) {
                const when = chance(0.3) ? laterToday(17) : workSlot(between(1, 5), 10, 17);
                const visitId = randomUUID();
                visits.push({
                  id: visitId,
                  organizationId: orgId,
                  leadId: id,
                  projectId: project.id,
                  builderId: project.builderId,
                  number: 1,
                  isRevisit: false,
                  scheduledAt: when,
                  status: chance(0.5) ? "CONFIRMED" : "SCHEDULED",
                  assignedToId: owner.id,
                  pickupRequired: chance(0.3),
                  attendees: between(1, 4),
                  createdById: owner.id,
                  createdByName: owner.user.name,
                  createdAt: office(now - between(1, 20) * HOUR),
                });
                activity(
                  DEAL_TYPES.VISIT_SCHEDULED,
                  `Visit 1 to ${project.name} planned`,
                  office(now - HOUR),
                  { visitId },
                  ownerActor,
                );
              }
            }
            if (chance(0.45)) {
              const at = office(createdRaw + span * 0.4);
              notes.push({
                id: randomUUID(),
                organizationId: orgId,
                leadId: id,
                authorId: (owner ?? admin).id,
                authorName: (owner ?? admin).user.name,
                body: pick(NOTES),
                createdAt: at,
              });
              activity(
                LEAD_ACTIVITY_TYPES.NOTE_ADDED,
                "Added a note",
                at,
                {},
                owner ? ownerActor : actor,
              );
              touch(at);
            }

            const finalStatus = status(finalKey);
            leads.push({
              id,
              organizationId: orgId,
              number,
              name,
              mobile: `+91 ${mobileDigits.slice(0, 5)} ${mobileDigits.slice(5)}`,
              mobileNormalized: `+91${mobileDigits}`,
              email: chance(0.7) ? `${first.toLowerCase()}.${between(10, 99)}@example.com` : null,
              emailNormalized: null,
              city,
              locality,
              sourceId: source.id,
              subSource: SUB_SOURCE,
              channel: "MANUAL",
              statusId: finalStatus.id,
              ownerId: owner?.id ?? null,
              ownerAssignedAt: owner ? stepAt(1) : null,
              createdById: admin.id,
              budgetMin,
              budgetMax: budgetMin + pick([10, 15, 20, 30]) * 100_000,
              propertyTypeId: apartment?.id ?? null,
              configurationTypeIds: bhk.length ? [pick(bhk).id] : [],
              preferredLocations: [locality],
              purpose: chance(0.7) ? "END_USE" : "INVESTMENT",
              buyingTimeline: pick([
                "IMMEDIATE",
                "WITHIN_3_MONTHS",
                "WITHIN_6_MONTHS",
                "WITHIN_1_YEAR",
              ]),
              temperature,
              tags: [TAG],
              statusChangedAt,
              lastActivityAt,
              lastCallAt,
              lastContactedAt,
              callAttempts,
              lastCallOutcomeId: lastOutcomeId,
              nextFollowUpAt,
              firstVisitAt,
              bookedAt,
              closedAt,
              lostAt,
              lossReasonId,
              createdAt,
            });
          }
        }
        for (const lead of leads) {
          if (lead.email) lead.emailNormalized = String(lead.email).toLowerCase();
        }
        // Parents before children.
        await tx.lead.createMany({ data: leads as never });
        await tx.leadProjectInterest.createMany({ data: interests as never });
        await tx.leadAssignment.createMany({ data: assignments as never });
        await tx.leadStatusHistory.createMany({ data: history as never });
        await tx.callLog.createMany({ data: calls as never });
        await tx.followUp.createMany({ data: followUps as never });
        await tx.siteVisit.createMany({ data: visits as never });
        await tx.booking.createMany({ data: bookings as never });
        await tx.leadNote.createMany({ data: notes as never });
        await tx.leadActivity.createMany({ data: activities as never });
        if (DRY_RUN) throw new DryRun("rolled back");
      },
      { timeout: 5 * 60_000, maxWait: 30_000 },
    )
    .catch((error: unknown) => {
      if (!(error instanceof DryRun)) throw error;
    });
  console.log(
    `${DRY_RUN ? "Dry run, nothing saved — would add" : "✔"} ${leads.length} demo leads with ${calls.length} calls, ${followUps.length} follow-ups, ${visits.length} site visits, ` +
      `${bookings.length} bookings and ${notes.length} notes`,
  );
  if (!DRY_RUN) await rebuildStats(orgId);
}

async function main() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo data is never added to production.");
  const orgId = await organizationId();
  if (process.argv.includes("--drop")) await drop(orgId);
  else await add(orgId);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
