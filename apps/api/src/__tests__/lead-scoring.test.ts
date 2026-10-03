import { jest } from "@jest/globals";
import { scoreLead, bandForScore } from "../lib/lead-scoring";

describe("scoreLead", () => {
  it("returns a zero score with no signals", () => {
    const result = scoreLead({ items: [] });
    expect(result.score).toBe(0);
    expect(result.band).toBe("low");
    expect(result.breakdown).toEqual([]);
  });

  it("scores an emergency service selection", () => {
    const result = scoreLead({ items: [{ productId: "emergency-support-response" }] });
    expect(result.breakdown.map((b) => b.rule)).toContain("emergency_selected");
    expect(result.score).toBe(30);
    expect(result.band).toBe("medium");
  });

  it("accumulates multiple rules into a higher band", () => {
    const result = scoreLead({
      items: [
        { productId: "emergency-support-response", name: "Emergency Response" },
        { productId: "monthly-it-plans-essentials", name: "Monthly IT Plan" },
      ],
      userCount: 25,
    });
    const rules = result.breakdown.map((b) => b.rule);
    expect(rules).toEqual(
      expect.arrayContaining([
        "emergency_selected",
        "monthly_plan_selected",
        "multiple_items",
        "ten_plus_users",
      ]),
    );
    expect(result.score).toBe(85);
    expect(result.band).toBe("priority");
  });

  it("honours explicit signals from the quote builder", () => {
    const result = scoreLead({
      items: ["consultation"],
      needsOnsite: true,
      adminAccessAvailable: true,
      requestedConsult: true,
    });
    const rules = result.breakdown.map((b) => b.rule);
    expect(rules).toEqual(
      expect.arrayContaining([
        "onsite_network_camera",
        "admin_access_available",
        "asked_for_consult",
      ]),
    );
    expect(result.score).toBe(40);
  });

  it("detects a consult request from the notes", () => {
    const result = scoreLead({ items: [], notes: "Please consult with us first" });
    expect(result.breakdown.map((b) => b.rule)).toContain("asked_for_consult");
  });

  it("caps the score at 100", () => {
    const result = scoreLead({
      items: [
        { productId: "emergency-support-response" },
        { productId: "monthly-it-plans-essentials" },
        { productId: "cyber-insurance-readiness" },
        { productId: "onsite-network-camera-install" },
      ],
      userCount: 50,
      needsOnsite: true,
      adminAccessAvailable: true,
      requestedConsult: true,
    });
    expect(result.score).toBe(100);
    expect(result.band).toBe("priority");
  });
});

describe("bandForScore", () => {
  it.each([
    [0, "low"],
    [24, "low"],
    [25, "medium"],
    [59, "medium"],
    [60, "high"],
    [84, "high"],
    [85, "priority"],
    [100, "priority"],
  ])("maps %i to %s", (score, band) => {
    expect(bandForScore(score)).toBe(band);
  });
});
