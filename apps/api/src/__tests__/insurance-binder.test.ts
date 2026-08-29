import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder  } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    JWT_SECRET: "test-jwt-secret",
    APP_BASE_URL: "http://localhost:3000",
    API_PORT: 4000,
    SMTP_HOST: "",
    EMAIL_FROM: "noreply@test.local",
    SENTRY_DSN: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    PUBLIC_TRAFFIC_WEBHOOK_URL: "",
    PUBLIC_LEAD_WEBHOOK_URL: "",
    JSM_DOMAIN: "",
    JSM_EMAIL: "",
    JSM_API_TOKEN: "",
    JSM_SERVICEDESK_ID: "",
    JSM_REQUEST_TYPE_ID: "",
  }),
}));
jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn(),
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()) }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import insuranceBinderRouter from "../routes/insurance-binder";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";

function mockAuth() {
  const supabase = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
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
const app = createTestApp();
app.use("/api/v1/insurance-binder", insuranceBinderRouter);
app.use(errorHandler);

describe("Insurance Binder API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists evidence (empty)", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app)
      .get("/api/v1/insurance-binder")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  it("creates evidence", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "ie-1",
          title: "Cyber Liability Policy",
          coverage_area: "network_security",
          status: "pending",
          organization_id: testOrgId,
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/insurance-binder")
      .set("Authorization", authToken)
      .send({
        organizationId: testOrgId,
        title: "Cyber Liability Policy",
        coverageArea: "network_security",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("Cyber Liability Policy");
  });

  it("gets evidence by id", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "ie-1",
          title: "Cyber Liability Policy",
          coverage_area: "network_security",
          organization_id: testOrgId,
        },
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/insurance-binder/ie-1")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Cyber Liability Policy");
  });

  it("returns 404 for non-existent evidence", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const res = await request(app)
      .get("/api/v1/insurance-binder/no-id")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("updates evidence", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "ie-1",
          title: "Updated Policy",
          status: "verified",
          coverage_area: "network_security",
          organization_id: testOrgId,
        },
        error: null,
      }),
    );
    const res = await request(app)
      .patch("/api/v1/insurance-binder/ie-1")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken)
      .send({ title: "Updated Policy", status: "verified" });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated Policy");
  });

  it("deletes evidence", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ error: null }));
    const res = await request(app)
      .delete("/api/v1/insurance-binder/ie-1")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });

  it("returns coverage report", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: [
          { coverage_area: "network_security", status: "verified" },
          { coverage_area: "endpoint_protection", status: "pending" },
          { coverage_area: "network_security", status: "pending" },
        ],
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/insurance-binder/coverage-report")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.completeness).toBe(25);
    expect(res.body.data.totalEvidence).toBe(3);
    expect(res.body.data.byCoverageArea.network_security.total).toBe(2);
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/insurance-binder");
    expect(res.status).toBe(401);
  });

  it("filters by coverage_area", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app)
      .get("/api/v1/insurance-binder")
      .query({ organization_id: testOrgId, coverage_area: "network_security" })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  it("returns 400 when creating evidence without a title", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/insurance-binder")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId });
    expect(res.status).toBe(400);
  });
});
