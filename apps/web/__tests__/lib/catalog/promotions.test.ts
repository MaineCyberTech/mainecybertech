import { validatePromotion } from "@/lib/catalog/promotions";

const validPromo = {
  name: "Spring Sale",
  badgeText: "Spring Sale Active",
  detailText: "Get 20% off",
  promoType: "seasonal_offer",
  status: "active" as const,
  terms: "Valid for new clients only",
  eligibilityTargets: ["new_clients"],
  startDate: "2026-04-01",
  endDate: "2026-06-30",
};

describe("validatePromotion", () => {
  it("passes a valid promotion", () => {
    const result = validatePromotion(validPromo);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("requires a name", () => {
    const result = validatePromotion({ ...validPromo, name: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name is required");
  });

  it("requires badge text for active status", () => {
    const result = validatePromotion({ ...validPromo, badgeText: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Badge text is required for active status");
  });

  it("requires terms for active status", () => {
    const result = validatePromotion({ ...validPromo, terms: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Terms are required for active status");
  });

  it("requires eligibility target for active status", () => {
    const result = validatePromotion({ ...validPromo, eligibilityTargets: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "At least one eligibility target is required for active status",
    );
  });

  it("catches end date before start date", () => {
    const result = validatePromotion({
      ...validPromo,
      startDate: "2026-06-30",
      endDate: "2026-04-01",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("End date cannot be before start date");
  });

  it("passes paused promotion without badge/terms/eligibility", () => {
    const result = validatePromotion({
      ...validPromo,
      status: "paused",
      badgeText: "",
      terms: "",
      eligibilityTargets: [],
    });
    expect(result.valid).toBe(true);
  });

  it("passes when no start/end dates provided", () => {
    const result = validatePromotion({
      ...validPromo,
      startDate: undefined,
      endDate: undefined,
    });
    expect(result.valid).toBe(true);
  });
});
