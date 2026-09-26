import { describe, expect, it } from "vitest";

import { type JourneyInput, journeySteps, nextStep } from "./journey";

const NOW = new Date("2026-09-26T10:00:00Z");

function lead(overrides: Partial<JourneyInput> = {}): JourneyInput {
  return {
    statusKey: "ASSIGNED",
    statusCategory: "OPEN",
    hasOwner: true,
    createdAt: "2026-09-20T09:00:00Z",
    lastContactedAt: null,
    callAttempts: 0,
    nextFollowUpAt: null,
    firstVisitAt: null,
    bookedAt: null,
    closedAt: null,
    ...overrides,
  };
}

describe("journeySteps", () => {
  it("starts at New", () => {
    const { steps, currentIndex } = journeySteps(lead());
    expect(currentIndex).toBe(0);
    expect(steps.map((step) => step.reached)).toEqual([true, false, false, false, false]);
    expect(steps[0]!.at).toBe("2026-09-20T09:00:00Z");
  });

  it("counts a reached customer or a contacted status as Contacted", () => {
    expect(journeySteps(lead({ lastContactedAt: "2026-09-21T09:00:00Z" })).currentIndex).toBe(1);
    expect(
      journeySteps(lead({ statusKey: "FOLLOW_UP", statusCategory: "ACTIVE" })).currentIndex,
    ).toBe(1);
  });

  it("does not count an unanswered lead as contacted", () => {
    const input = lead({ statusKey: "UNRESPONSIVE", statusCategory: "ACTIVE", callAttempts: 4 });
    expect(journeySteps(input).currentIndex).toBe(0);
  });

  it("implies the earlier stages from a later milestone", () => {
    const { steps, currentIndex } = journeySteps(
      lead({ bookedAt: "2026-09-25T09:00:00Z", statusKey: "BOOKING", statusCategory: "BOOKING" }),
    );
    expect(currentIndex).toBe(3);
    expect(steps.slice(0, 4).every((step) => step.reached)).toBe(true);
    expect(steps[3]!.at).toBe("2026-09-25T09:00:00Z");
    expect(steps[2]!.at).toBeNull();
  });

  it("reaches Won when the lead is closed as won", () => {
    expect(
      journeySteps(lead({ statusCategory: "WON", closedAt: "2026-09-26T08:00:00Z" })).currentIndex,
    ).toBe(4);
  });
});

describe("nextStep", () => {
  it("reports closed leads first", () => {
    expect(nextStep(lead({ statusCategory: "INVALID" }), NOW)).toBe("invalid");
    expect(nextStep(lead({ statusCategory: "LOST" }), NOW)).toBe("lost");
    expect(nextStep(lead({ statusCategory: "WON" }), NOW)).toBe("won");
  });

  it("asks for an owner before anything else", () => {
    expect(nextStep(lead({ hasOwner: false, nextFollowUpAt: "2026-09-25T00:00:00Z" }), NOW)).toBe(
      "unassigned",
    );
  });

  it("puts an overdue follow-up ahead of the rest", () => {
    expect(nextStep(lead({ nextFollowUpAt: "2026-09-26T09:00:00Z" }), NOW)).toBe("overdue");
  });

  it("asks for the first call, then suggests another channel after unanswered calls", () => {
    expect(nextStep(lead(), NOW)).toBe("first-contact");
    expect(nextStep(lead({ callAttempts: 3 }), NOW)).toBe("unanswered");
  });

  it("wants a planned next step for contacted leads", () => {
    const contacted = lead({ lastContactedAt: "2026-09-24T10:00:00Z", statusKey: "CONTACTED" });
    expect(nextStep(contacted, NOW)).toBe("no-plan");
    expect(nextStep({ ...contacted, nextFollowUpAt: "2026-09-28T10:00:00Z" }, NOW)).toBe(
      "on-track",
    );
  });

  it("follows up on a visit that has not turned into a booking", () => {
    const visited = lead({
      firstVisitAt: "2026-09-24T10:00:00Z",
      statusKey: "VISIT",
      statusCategory: "ACTIVE",
      nextFollowUpAt: "2026-09-27T10:00:00Z",
    });
    expect(nextStep(visited, NOW)).toBe("after-visit");
  });

  it("keeps a booking moving", () => {
    expect(
      nextStep(lead({ statusCategory: "BOOKING", bookedAt: "2026-09-25T00:00:00Z" }), NOW),
    ).toBe("booking");
  });
});
