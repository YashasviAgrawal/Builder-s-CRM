import { describe, expect, it } from "vitest";

import { campaignCodeFromName } from "./masters";

describe("campaignCodeFromName", () => {
  it("turns a campaign name into a valid code", () => {
    expect(campaignCodeFromName("Diwali Expo 2026")).toBe("diwali-expo-2026");
    expect(campaignCodeFromName("  Facebook — Lead Ads (Q3)  ")).toBe("facebook-lead-ads-q3");
    expect(campaignCodeFromName("Café Événement")).toBe("cafe-evenement");
  });

  it("stays within the code rules", () => {
    const code = campaignCodeFromName("A very long campaign name that goes on and on and on");
    expect(code.length).toBeLessThanOrEqual(36);
    expect(code).toMatch(/^[a-z0-9][a-z0-9._-]*$/);
    expect(code.endsWith("-")).toBe(false);
  });

  it("falls back when nothing usable is left", () => {
    expect(campaignCodeFromName("!!")).toBe("campaign");
    expect(campaignCodeFromName("x")).toBe("campaign");
  });
});
