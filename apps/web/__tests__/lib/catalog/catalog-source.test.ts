import type { StoreCategory, StoreProduct } from "@mct/sdk";

const getApiClient = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => getApiClient(),
}));

import {
  loadCatalog,
  visibleProducts,
  productBySlug,
  productsInCategory,
  categoryBySlug,
  featuredProducts,
  monthlyPlans,
  emergencyProducts,
} from "@/lib/catalog/catalog-source";

function dbProduct(overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: "p-1",
    slug: "p-1",
    name: "Product One",
    categoryId: "cat-1",
    category: "Category One",
    type: "service",
    display: true,
    status: "active",
    priceRange: "$100",
    summary: "Summary one",
    tags: [],
    attributes: {},
    ...overrides,
  };
}

function dbCategory(overrides: Partial<StoreCategory> = {}): StoreCategory {
  return {
    id: "cat-1",
    name: "Category One",
    slug: "category-one",
    description: "Desc",
    productIds: [],
    count: 0,
    ...overrides,
  };
}

function mockDb(products: StoreProduct[], categories: StoreCategory[]) {
  getApiClient.mockReturnValue({
    store: {
      listProducts: jest.fn().mockResolvedValue(products),
      listCategories: jest.fn().mockResolvedValue(categories),
    },
  });
}

describe("catalog-source", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loadCatalog", () => {
    it("uses the DB-backed catalog when the API returns data", async () => {
      mockDb([dbProduct()], [dbCategory()]);

      const snapshot = await loadCatalog();

      expect(snapshot.source).toBe("db");
      expect(snapshot.products).toHaveLength(1);
      expect(snapshot.products[0].name).toBe("Product One");
    });

    it("flattens DB attributes into the flat CatalogProduct shape", async () => {
      mockDb(
        [
          dbProduct({
            attributes: {
              bestFor: ["Small business"],
              whatIsIncluded: ["Setup"],
              riskLevel: "elevated",
              bundleEligible: true,
            },
          }),
        ],
        [dbCategory()],
      );

      const snapshot = await loadCatalog();

      expect(snapshot.products[0].bestFor).toEqual(["Small business"]);
      expect(snapshot.products[0].whatIsIncluded).toEqual(["Setup"]);
      expect(snapshot.products[0].riskLevel).toBe("elevated");
      expect(snapshot.products[0].bundleEligible).toBe(true);
    });

    it("derives category counts from products rather than the stored column", async () => {
      mockDb(
        [dbProduct({ categoryId: "cat-1" }), dbProduct({ id: "p-2", categoryId: "cat-1" })],
        [dbCategory({ count: 99 })],
      );

      const snapshot = await loadCatalog();

      expect(snapshot.categories[0].count).toBe(2);
    });

    it("falls back to the bundled JSON when the API throws", async () => {
      getApiClient.mockReturnValue({
        store: {
          listProducts: jest.fn().mockRejectedValue(new Error("API down")),
          listCategories: jest.fn().mockRejectedValue(new Error("API down")),
        },
      });

      const snapshot = await loadCatalog();

      expect(snapshot.source).toBe("static");
      expect(snapshot.products.length).toBeGreaterThan(100);
      expect(snapshot.categories.length).toBeGreaterThan(0);
    });

    it("falls back to the bundled JSON when the tables are empty", async () => {
      mockDb([], []);

      const snapshot = await loadCatalog();

      expect(snapshot.source).toBe("static");
      expect(snapshot.products.length).toBeGreaterThan(100);
    });
  });

  describe("selectors", () => {
    it("filters visible, featured and per-category products", async () => {
      mockDb(
        [
          dbProduct({ id: "a", slug: "a", tags: ["quick-win"], categoryId: "cat-1" }),
          dbProduct({ id: "b", slug: "b", display: false, categoryId: "cat-1" }),
          dbProduct({ id: "c", slug: "c", categoryId: "monthly-it-plans" }),
          dbProduct({ id: "d", slug: "d", categoryId: "emergency-support" }),
        ],
        [dbCategory()],
      );

      const snapshot = await loadCatalog();

      expect(visibleProducts(snapshot).map((p) => p.id)).toEqual(["a", "c", "d"]);
      expect(featuredProducts(snapshot).map((p) => p.id)).toEqual(["a"]);
      expect(monthlyPlans(snapshot).map((p) => p.id)).toEqual(["c"]);
      expect(emergencyProducts(snapshot).map((p) => p.id)).toEqual(["d"]);
      expect(productsInCategory(snapshot, "cat-1").map((p) => p.id)).toEqual(["a", "b"]);
      expect(productBySlug(snapshot, "c")?.id).toBe("c");
      expect(productBySlug(snapshot, "missing")).toBeUndefined();
      expect(categoryBySlug(snapshot, "category-one")?.id).toBe("cat-1");
      expect(categoryBySlug(snapshot, "missing")).toBeUndefined();
    });
  });
});
