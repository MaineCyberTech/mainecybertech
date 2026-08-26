import { jest } from "@jest/globals";
import request from "supertest";
import billingRouter from "../routes/billing";
import { createTestApp, createMockBuilder, tableAwareFrom, type MockResult } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
    APP_BASE_URL: "http://localhost:3000",
    STRIPE_SECRET_KEY: "sk_test_x",
    STRIPE_WEBHOOK_SECRET: "",
  }),
}));

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../lib/http-client", () => ({
  httpClients: {
    stripe: {
      fetch: jest.fn(),
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { getSupabaseAdmin } from "../services/supabase";
import { httpClients } from "../lib/http-client";

function mockAuth() {
  const supabase: any = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "admin-1", email: "admin@test.com" } },
    error: null,
  });
  return supabase;
}

/*
 * Route-level suite: auth/permission/subscription middleware is stubbed so
 * mocks serve route queries only. Enforcement itself is covered by the
 * dedicated middleware-*.test.ts suites.
 */
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/permissions", () => ({
  requirePermission:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));
jest.mock("../middleware/require-active-subscription", () => ({
  requireActiveSubscription: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = createTestApp();
app.use("/api/v1/billing", billingRouter);
app.use(errorHandler);

describe("billing routes", () => {
  let supabase: any;

  beforeEach(() => {
    supabase = mockAuth();
    jest.clearAllMocks();
  });

  it("GET /invoices returns paginated invoices", async () => {
    supabase.from.mockReturnValue(
      createMockBuilder({ data: [{ id: "inv1" }], error: null, count: 1 } as MockResult),
    );
    const res = await request(app)
      .get("/api/v1/billing/invoices")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /subscriptions returns subscriptions", async () => {
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: [{ id: "sub1", plan_name: "Premium" }],
        error: null,
      } as MockResult),
    );
    const res = await request(app)
      .get("/api/v1/billing/subscriptions")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /payments returns paginated payments", async () => {
    supabase.from.mockReturnValue(
      createMockBuilder({ data: [], error: null, count: 0 } as MockResult),
    );
    const res = await request(app)
      .get("/api/v1/billing/payments")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /billing-customer returns null when no org_id and no customer", async () => {
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
        count: 0,
      } as MockResult),
    );
    const res = await request(app)
      .get("/api/v1/billing/billing-customer")
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it("GET /invoices/:id scopes the query to the caller's organization", async () => {
    supabase.from.mockReturnValue(
      createMockBuilder({ data: { id: "inv1", total_cents: 5000 }, error: null } as MockResult),
    );
    const res = await request(app)
      .get(
        "/api/v1/billing/invoices/inv1?organization_id=00000000-0000-0000-0000-000000000001",
      )
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("inv1");

    const builder = supabase.from.mock.results[0].value as ReturnType<
      typeof createMockBuilder
    >;
    expect(builder.eq).toHaveBeenCalledWith(
      "organization_id",
      "00000000-0000-0000-0000-000000000001",
    );
  });

  it("GET /invoices/:id returns 404 for an invoice in another org", async () => {
    supabase.from.mockReturnValue(
      createMockBuilder({ data: null, error: new Error("No rows") } as MockResult),
    );
    const res = await request(app)
      .get(
        "/api/v1/billing/invoices/inv-other?organization_id=00000000-0000-0000-0000-000000000002",
      )
      .set("Authorization", "Bearer token");
    expect(res.status).toBe(404);
  });

  it("GET / returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/billing/invoices");
    expect(res.status).toBe(401);
  });

  describe("POST /create-portal-session", () => {
    function mockStripePortal() {
      (httpClients.stripe.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ url: "https://billing.stripe.com/session/xyz" }),
      });
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { stripe_customer_id: "cus_123" },
          error: null,
        } as MockResult),
      );
    }

    it("reads the org from the body (SDK sends organizationId in the body)", async () => {
      mockStripePortal();
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token")
        .send({ organizationId: "00000000-0000-0000-0000-000000000001" });
      expect(res.status).toBe(200);
      expect(res.body.data.url).toBe("https://billing.stripe.com/session/xyz");
      const builder = supabase.from.mock.results[0].value as ReturnType<
        typeof createMockBuilder
      >;
      expect(builder.eq).toHaveBeenCalledWith(
        "organization_id",
        "00000000-0000-0000-0000-000000000001",
      );
    });

    it("still accepts organization_id from the query string", async () => {
      mockStripePortal();
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session?organization_id=00000000-0000-0000-0000-000000000001")
        .set("Authorization", "Bearer token");
      expect(res.status).toBe(200);
      const builder = supabase.from.mock.results[0].value as ReturnType<
        typeof createMockBuilder
      >;
      expect(builder.eq).toHaveBeenCalledWith(
        "organization_id",
        "00000000-0000-0000-0000-000000000001",
      );
    });

    it("falls back to the X-Active-Org header (web client sends no body org)", async () => {
      mockStripePortal();
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token")
        .set("X-Active-Org", "00000000-0000-0000-0000-000000000001");
      expect(res.status).toBe(200);
      const builder = supabase.from.mock.results[0].value as ReturnType<
        typeof createMockBuilder
      >;
      expect(builder.eq).toHaveBeenCalledWith(
        "organization_id",
        "00000000-0000-0000-0000-000000000001",
      );
    });

    it("returns 400 when no org can be resolved", async () => {
      mockStripePortal();
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token");
      expect(res.status).toBe(400);
    });

    it("returns 404 when the org has no Stripe customer", async () => {
      mockStripePortal();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: null,
          error: { code: "PGRST116", message: "No rows" },
        } as MockResult),
      );
      const res = await request(app)
        .post("/api/v1/billing/create-portal-session")
        .set("Authorization", "Bearer token")
        .send({ organizationId: "00000000-0000-0000-0000-000000000001" });
      expect(res.status).toBe(404);
    });
  });
});
