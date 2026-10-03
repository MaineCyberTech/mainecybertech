import {
  getRecommendationsForProduct,
  getRecommendationsForCategory,
  getAllBundles,
  getRecommendationType,
  getRelatedProducts,
} from "@/lib/catalog/bundles";
import { getProductById } from "@/lib/catalog/loader";

describe("getRecommendationsForProduct", () => {
  it("returns an array of products for a known product", () => {
    const results = getRecommendationsForProduct("password_security_checkup");
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
    }
  });
});

describe("getRecommendationsForCategory", () => {
  it("returns recommendations for Quick Fixes category", () => {
    const results = getRecommendationsForCategory("Quick Fixes");
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
    }
  });
});

describe("getAllBundles", () => {
  it("returns an array with at least 1 bundle", () => {
    const bundles = getAllBundles();
    expect(Array.isArray(bundles)).toBe(true);
    expect(bundles.length).toBeGreaterThanOrEqual(1);
  });
});

describe("getRecommendationType", () => {
  it('returns "bundle" for business-starter-packs products', () => {
    const product = getProductById("small_business_it_starter_pack");
    expect(product).toBeDefined();
    expect(getRecommendationType(product!.id)).toBe("bundle");
  });

  it('returns "related" for a basic product', () => {
    const product = getProductById("password_security_checkup");
    expect(product).toBeDefined();
    expect(getRecommendationType(product!.id)).toBe("related");
  });
});

describe("getRelatedProducts", () => {
  it("returns products from same category, excluding the requested product", () => {
    const productId = "password_security_checkup";
    const product = getProductById(productId);
    expect(product).toBeDefined();

    const related = getRelatedProducts(productId);
    expect(Array.isArray(related)).toBe(true);

    for (const p of related) {
      expect(p.categoryId).toBe(product!.categoryId);
      expect(p.id).not.toBe(productId);
    }
  });

  it("does not include the requested product itself", () => {
    const productId = "password_security_checkup";
    const related = getRelatedProducts(productId);
    const ids = related.map((p) => p.id);
    expect(ids).not.toContain(productId);
  });
});
