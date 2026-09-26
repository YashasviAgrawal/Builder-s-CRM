/**
 * The lead journey (lead page): how far a lead has come — New → Contacted → Site visit → Booking → Won — and the one
 * next step that matters most right now. Pure functions of the lead's summary fields, so the page, lists and tests
 * all read the same rules.
 */

export const JOURNEY_STAGES = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "visit", label: "Site visit" },
  { key: "booking", label: "Booking" },
  { key: "won", label: "Won" },
] as const;

export type JourneyStageKey = (typeof JOURNEY_STAGES)[number]["key"];

export interface JourneyInput {
  statusKey: string;
  /** OPEN | ACTIVE | BOOKING | WON | LOST | INVALID */
  statusCategory: string;
  hasOwner: boolean;
  createdAt: string;
  lastContactedAt: string | null;
  /** Unanswered calls since the customer was last reached. */
  callAttempts: number;
  nextFollowUpAt: string | null;
  firstVisitAt: string | null;
  bookedAt: string | null;
  closedAt: string | null;
}

export interface JourneyStep {
  key: JourneyStageKey;
  label: string;
  reached: boolean;
  /** When the stage was reached, if the CRM knows it. */
  at: string | null;
}

const CONTACTED_STATUSES = new Set(["CONTACTED", "POSITIVE", "NEGATIVE", "FOLLOW_UP", "CALLBACK"]);
const VISIT_STATUSES = new Set(["VISIT", "REVISIT"]);

/** The five stages with what was reached; a later stage implies the earlier ones. */
export function journeySteps(input: JourneyInput): { steps: JourneyStep[]; currentIndex: number } {
  const won = Boolean(input.closedAt) || input.statusCategory === "WON";
  const booking = won || Boolean(input.bookedAt) || input.statusCategory === "BOOKING";
  const visit = booking || Boolean(input.firstVisitAt) || VISIT_STATUSES.has(input.statusKey);
  const contacted =
    visit || Boolean(input.lastContactedAt) || CONTACTED_STATUSES.has(input.statusKey);
  const reached: Record<JourneyStageKey, [boolean, string | null]> = {
    new: [true, input.createdAt],
    contacted: [contacted, input.lastContactedAt],
    visit: [visit, input.firstVisitAt],
    booking: [booking, input.bookedAt],
    won: [won, input.closedAt],
  };
  const steps = JOURNEY_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    reached: reached[stage.key][0],
    at: reached[stage.key][0] ? reached[stage.key][1] : null,
  }));
  return { steps, currentIndex: steps.findLastIndex((step) => step.reached) };
}

export type NextStepKind =
  | "invalid"
  | "lost"
  | "won"
  | "unassigned"
  | "overdue"
  | "booking"
  | "unanswered"
  | "first-contact"
  | "no-plan"
  | "after-visit"
  | "on-track";

/** How many unanswered calls in a row make "try another way" the advice. */
export const UNANSWERED_CALLS_THRESHOLD = 3;

/** The single most useful next step for the lead's owner, in priority order. */
export function nextStep(input: JourneyInput, now: Date = new Date()): NextStepKind {
  if (input.statusCategory === "INVALID") return "invalid";
  if (input.statusCategory === "LOST") return "lost";
  if (input.statusCategory === "WON") return "won";
  if (!input.hasOwner) return "unassigned";
  if (input.nextFollowUpAt && new Date(input.nextFollowUpAt).getTime() < now.getTime()) {
    return "overdue";
  }
  if (input.statusCategory === "BOOKING") return "booking";
  const { steps } = journeySteps(input);
  const contacted = steps[1]!.reached;
  if (!contacted) {
    return input.callAttempts >= UNANSWERED_CALLS_THRESHOLD ? "unanswered" : "first-contact";
  }
  if (input.callAttempts >= UNANSWERED_CALLS_THRESHOLD) return "unanswered";
  if (!input.nextFollowUpAt) return "no-plan";
  if (steps[2]!.reached && !steps[3]!.reached) return "after-visit";
  return "on-track";
}
