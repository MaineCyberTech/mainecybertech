import {
  validateCatalog,
  validateSlugsUnique,
  validateRecommendations,
} from "@/lib/catalog/validation";
import { getCategoryOrder, getCategories } from "@/lib/catalog/loader";

describe("validateCatalog", () => {
  it("returns no duplicate ID issues", () => {
    const report = validateCatalog();
    const dupIds = report.issues.filter((i) => i.type === "duplicate_id");
    expect(dupIds).toHaveLength(0);
  });

  it("returns no duplicate slug issues", () => {
    const report = validateCatalog();
    const dupSlugs = report.issues.filter((i) => i.type === "duplicate_slug");
    expect(dupSlugs).toHaveLength(0);
  });

  it("confirms all 12 categories are represented", () => {
    const report = validateCatalog();
    const missingFromData = report.issues.filter((i) => i.type === "missing_category_from_data");
    expect(missingFromData).toHaveLength(0);

    const categoryOrder = getCategoryOrder();
    expect(categoryOrder).toHaveLength(12);
  });

  it("confirms each category has at least one product", () => {
    const categories = getCategories();
    for (const cat of categories) {
      expect(cat.productIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("finds no empty summaries", () => {
    const report = validateCatalog();
    const empty = report.issues.filter((i) => i.type === "empty_summary");
    expect(empty).toHaveLength(0);
  });

  it("finds no missing price ranges", () => {
    const report = validateCatalog();
    const missing = report.issues.filter((i) => i.type === "missing_price");
    expect(missing).toHaveLength(0);
  });

  it("runs the invalid recommendation check", () => {
    const report = validateCatalog();
    const invalid = report.issues.filter((i) => i.type === "invalid_recommendation");
    expect(Array.isArray(invalid)).toBe(true);
  });
});

describe("validateSlugsUnique", () => {
  it("returns no issues", () => {
    const issues = validateSlugsUnique();
    expect(issues).toHaveLength(0);
  });
});

describe("validateRecommendations", () => {
  it("returns issues array", () => {
    const issues = validateRecommendations();
    expect(Array.isArray(issues)).toBe(true);
  });
});
