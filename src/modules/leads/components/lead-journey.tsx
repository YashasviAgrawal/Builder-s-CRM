import {
  Building2,
  CalendarClock,
  CalendarX2,
  Check,
  CheckCircle2,
  FileSignature,
  Hourglass,
  type LucideIcon,
  PhoneCall,
  PhoneMissed,
  UserPlus,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { RelativeTime } from "@/components/shared/relative-time";
import { Card } from "@/components/ui/card";
import { formatDate, formatDateTime, type RegionalFormatSettings } from "@/lib/format";
import { cn, plural } from "@/lib/utils";

import { journeySteps, nextStep, type NextStepKind } from "../journey";
import type { LeadDetail } from "../server/leads";

type Tone = "attention" | "info" | "success" | "muted";

const TONE_STYLES: Record<Tone, { box: string; icon: string }> = {
  attention: {
    box: "border-highlight/45 bg-highlight/12",
    icon: "bg-highlight text-highlight-foreground",
  },
  info: { box: "border-primary/15 bg-accent", icon: "bg-primary text-primary-foreground" },
  success: { box: "border-success/25 bg-success/10", icon: "bg-success text-success-foreground" },
  muted: { box: "border-border bg-muted", icon: "bg-muted-foreground/15 text-muted-foreground" },
};

const DAY = 86_400_000;
const daysSince = (iso: string, now: Date) =>
  Math.max(0, Math.floor((now.getTime() - Date.parse(iso)) / DAY));

function Fact({
  icon: Icon,
  label,
  value,
  detail,
  warn,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  detail: ReactNode;
  warn?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-card px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className={cn("size-3.5", warn && "text-highlight-ink")} aria-hidden />
        {label}
      </p>
      <p className={cn("mt-1 truncate text-sm font-semibold", warn && "text-highlight-ink")}>
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

/**
 * The lead journey card on the lead page: stages reached, the next best step for the owner, and the timing facts
 * a salesperson checks before calling (next follow-up, last contact, age).
 */
export function LeadJourney({
  lead,
  regional,
}: {
  lead: LeadDetail;
  regional: Pick<RegionalFormatSettings, "timezone" | "dateFormat">;
}) {
  const now = new Date();
  const input = {
    statusKey: lead.status.key,
    statusCategory: lead.status.category,
    hasOwner: Boolean(lead.owner),
    createdAt: lead.createdAt,
    lastContactedAt: lead.lastContactedAt,
    callAttempts: lead.callAttempts,
    nextFollowUpAt: lead.nextFollowUpAt,
    firstVisitAt: lead.firstVisitAt,
    bookedAt: lead.bookedAt,
    closedAt: lead.closedAt,
  };
  const { steps, currentIndex } = journeySteps(input);
  const kind = nextStep(input, now);
  const closedLost = lead.status.category === "LOST" || lead.status.category === "INVALID";
  const overdue = kind === "overdue";
  const relative = (iso: string | null) => (iso ? <RelativeTime value={iso} /> : null);

  const NEXT: Record<
    NextStepKind,
    { tone: Tone; icon: LucideIcon; title: string; detail: ReactNode }
  > = {
    invalid: {
      tone: "muted",
      icon: XCircle,
      title: "Marked invalid or duplicate",
      detail: "Nothing more to do on this lead.",
    },
    lost: {
      tone: "muted",
      icon: XCircle,
      title: `Closed as ${lead.status.label.toLowerCase()}`,
      detail: (
        <>
          {lead.lossReason ? `Reason: ${lead.lossReason.label}. ` : ""}Reopen the lead if the
          customer comes back.
        </>
      ),
    },
    won: {
      tone: "success",
      icon: CheckCircle2,
      title: "Won — deal closed",
      detail: (
        <>
          {lead.closedAt ? `Closed on ${formatDate(lead.closedAt, regional)}. ` : ""}Ask for a
          referral while they are happy.
        </>
      ),
    },
    unassigned: {
      tone: "attention",
      icon: UserPlus,
      title: "Assign an owner",
      detail:
        "Nobody is responsible for this lead yet — assign it so the customer gets a call today.",
    },
    overdue: {
      tone: "attention",
      icon: CalendarX2,
      title: "Follow-up overdue",
      detail: (
        <>
          It was due {relative(lead.nextFollowUpAt)}. Call the customer now, or move the follow-up.
        </>
      ),
    },
    booking: {
      tone: "info",
      icon: FileSignature,
      title: "Booking in progress",
      detail: "Keep the paperwork and payments moving to close the deal.",
    },
    unanswered: {
      tone: "attention",
      icon: PhoneMissed,
      title: `${plural(lead.callAttempts, "unanswered call")} in a row`,
      detail: "Try another time of day, or reach out on WhatsApp or by e-mail.",
    },
    "first-contact": {
      tone: "attention",
      icon: PhoneCall,
      title: "Make the first call",
      detail: "New enquiries cool down fast — reach the customer today.",
    },
    "no-plan": {
      tone: "attention",
      icon: CalendarClock,
      title: "No next step planned",
      detail: "Schedule a follow-up so this lead does not slip through.",
    },
    "after-visit": {
      tone: "info",
      icon: Building2,
      title: "Follow up on the site visit",
      detail: (
        <>
          Visited {lead.firstVisitAt ? formatDate(lead.firstVisitAt, regional) : "recently"}. Next
          follow-up {relative(lead.nextFollowUpAt)}.
        </>
      ),
    },
    "on-track": {
      tone: "success",
      icon: CheckCircle2,
      title: "On track",
      detail: <>Next follow-up {relative(lead.nextFollowUpAt)}.</>,
    },
  };
  const next = NEXT[kind];
  const tone = TONE_STYLES[next.tone];
  const NextIcon = next.icon;

  return (
    <Card className="mb-6 gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 sm:px-6">
        <h2 className="text-sm font-semibold">Lead journey</h2>
        {closedLost ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
            <XCircle className="size-3.5" aria-hidden />
            {lead.status.label}
            {lead.lossReason ? ` · ${lead.lossReason.label}` : ""}
          </span>
        ) : null}
      </div>

      <ol aria-label="Lead journey stages" className="grid grid-cols-5 px-3 pt-5 pb-6 sm:px-6">
        {steps.map((step, index) => {
          const current = index === currentIndex && !closedLost && step.key !== "won";
          return (
            <li key={step.key} className="relative flex min-w-0 flex-col items-center text-center">
              {index > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-4 right-1/2 left-[-50%] h-0.5 -translate-y-1/2",
                    step.reached
                      ? closedLost
                        ? "bg-muted-foreground/40"
                        : "bg-primary"
                      : "bg-border",
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  step.reached
                    ? closedLost
                      ? "border-muted-foreground/50 bg-muted-foreground/50 text-white"
                      : step.key === "won"
                        ? "border-success bg-success text-success-foreground"
                        : "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                  current && "ring-4 ring-highlight/35",
                )}
              >
                {step.reached ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "mt-2 max-w-full truncate text-xs font-medium sm:text-sm",
                  step.reached ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {step.at ? formatDate(step.at, regional) : " "}
              </span>
              <span className="sr-only">
                {current ? "current stage" : step.reached ? "reached" : "not reached yet"}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-4 border-t bg-muted/40 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <div className={cn("flex gap-3 rounded-lg border p-3.5", tone.box)} role="status">
          <span
            className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tone.icon)}
          >
            <NextIcon className="size-[18px]" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Next step
            </p>
            <p className="text-sm font-semibold">{next.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{next.detail}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Fact
            icon={CalendarClock}
            label="Next follow-up"
            value={relative(lead.nextFollowUpAt) ?? "Nothing planned"}
            detail={
              lead.nextFollowUpAt
                ? formatDateTime(lead.nextFollowUpAt, regional)
                : "No open follow-up"
            }
            warn={overdue}
          />
          <Fact
            icon={PhoneCall}
            label="Last contacted"
            value={relative(lead.lastContactedAt) ?? "Not yet"}
            detail={
              lead.callAttempts
                ? `${plural(lead.callAttempts, "unanswered call")} since`
                : lead.lastCallAt
                  ? "Reached on the last call"
                  : "No calls logged yet"
            }
            warn={lead.callAttempts >= 3}
          />
          <Fact
            icon={Hourglass}
            label="Lead age"
            value={plural(daysSince(lead.createdAt, now), "day")}
            detail={`${lead.status.label} for ${plural(daysSince(lead.statusChangedAt, now), "day")}`}
          />
        </div>
      </div>
    </Card>
  );
}
