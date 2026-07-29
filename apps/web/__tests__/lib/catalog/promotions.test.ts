import {
  getPromotions,
  createPromotion,
  getActivePromotions,
  validatePromotion,
  updatePromotion,
  deletePromotion,
  __resetPromotionsForTest,
} from "@/lib/catalog/promotions";

beforeEach(() => {
  __resetPromotionsForTest();
});

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

describe("getPromotions", () => {
  it("returns an empty array when no promotions exist", () => {
    const result = getPromotions();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("returns all created promotions", () => {
    createPromotion(validPromo);
    createPromotion({ ...validPromo, name: "Summer Sale" });
    expect(getPromotions()).toHaveLength(2);
  });
});

describe("createPromotion", () => {
  it("adds a promotion and returns it with an id", () => {
    const result = createPromotion(validPromo);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveProperty("id");
      expect(result.data.name).toBe("Spring Sale");
    }
  });

  it("fails validation when name is empty", () => {
    const result = createPromotion({ ...validPromo, name: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Name is required");
    }
  });
});

describe("getActivePromotions", () => {
  it("only returns promotions with status active", () => {
    createPromotion(validPromo);
    createPromotion({ ...validPromo, name: "Inactive Deal", status: "paused" });
    const active = getActivePromotions();
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe("Spring Sale");
  });

  it("returns empty array when no promotions are active", () => {
    createPromotion({ ...validPromo, name: "Inactive Deal", status: "paused" });
    expect(getActivePromotions()).toHaveLength(0);
  });
});

describe("validatePromotion", () => {
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
});

describe("updatePromotion", () => {
  it("modifies an existing promotion", () => {
    const created = createPromotion(validPromo);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const updated = updatePromotion(created.data.id, { name: "Spring Sale Updated" });
    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.data.name).toBe("Spring Sale Updated");
    }
  });

  it("returns error for non-existent id", () => {
    const result = updatePromotion("nonexistent", { name: "Nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Promotion not found");
    }
  });
});

describe("deletePromotion", () => {
  it("removes a promotion", () => {
    const created = createPromotion(validPromo);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(getPromotions()).toHaveLength(1);
    const deleted = deletePromotion(created.data.id);
    expect(deleted.ok).toBe(true);
    expect(getPromotions()).toHaveLength(0);
  });

  it("returns error for non-existent id", () => {
    const result = deletePromotion("nonexistent");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Promotion not found");
    }
  });
});
