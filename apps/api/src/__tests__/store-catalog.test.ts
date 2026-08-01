import { jest } from "@jest/globals";
import request from "supertest";
import storeRouter from "../routes/store";
import { createTestApp } from "./helpers";
import { errorHandler } from "../middleware/error";
import { getCategories, getProductsByCategory } from "../lib/store-catalog";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@sentry/node", () => ({
  captureException: jest.fn(),
}));

describe("store catalog lib", () => {
  it("getCategories returns categories", () => {
    const cats = getCategories();
    expect(cats.length).toBeGreaterThan(0);
    const result = cats.map((c) => ({
      ...c,
      productCount: getProductsByCategory(c.slug).length,
    }));
    expect(result[0].productCount).toBeDefined();
  });
});

const app = createTestApp();
app.use("/api/v1/store", storeRouter);
app.use(errorHandler);

describe("store catalog routes", () => {
  describe("GET /products", () => {
    it("returns all products", async () => {
      const res = await request(app).get("/api/v1/store/products");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(245);
      const slugs = new Set(res.body.data.map((p: any) => p.slug));
      expect(slugs.has("password-security-checkup")).toBe(true);
    });

    it("filters products by category", async () => {
      const res = await request(app).get("/api/v1/store/products?category=cybersecurity");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((p: any) => {
        expect(p.categoryId).toBe("cybersecurity");
      });
    });
  });

  describe("GET /products/:slug", () => {
    it("returns a product by slug", async () => {
      const res = await request(app).get("/api/v1/store/products/password-security-checkup");
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe("password-security-checkup");
      expect(res.body.data.name).toBeDefined();
      expect(res.body.data.summary).toBeDefined();
    });

    it("returns 404 for unknown slug", async () => {
      const res = await request(app).get("/api/v1/store/products/non-existent");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /categories", () => {
    it("returns all categories with product counts", async () => {
      const res = await request(app).get("/api/v1/store/categories");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].productCount).toBeDefined();
    });
  });

  describe("GET /categories/:slug", () => {
    it("returns a category with products", async () => {
      const res = await request(app).get("/api/v1/store/categories/cybersecurity");
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe("cybersecurity");
      expect(res.body.data.products).toBeInstanceOf(Array);
      expect(res.body.data.products.length).toBeGreaterThan(0);
    });

    it("returns 404 for unknown slug", async () => {
      const res = await request(app).get("/api/v1/store/categories/non-existent");
      expect(res.status).toBe(404);
    });
  });
});