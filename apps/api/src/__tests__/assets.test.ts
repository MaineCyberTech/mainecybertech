import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub } from "./helpers";
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
    SMTP_USER: "",
    SMTP_PASS: "",
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
import assetsRouter from "../routes/assets";

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
 * mocks serve route queries only. The org-access stub (createOrgAccessStub)
 * additionally populates req.orgScope so the tenant-isolation gate in
 * lib/tenant.ts is genuinely exercised. Enforcement via real membership
 * lookups is covered by middleware-org-access.test.ts.
 */
jest.mock("../middleware/org-access", () =>
  createOrgAccessStub("00000000-0000-0000-0000-000000000001"),
);
jest.mock("../middleware/permissions", () => ({
  requirePermission:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));
const app = createTestApp();
app.use("/api/v1/assets", assetsRouter);
app.use(errorHandler);

describe("Assets API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty list", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app).get("/api/v1/assets").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  it("returns stats", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
    const res = await request(app).get("/api/v1/assets/stats").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.byStatus).toBeDefined();
    expect(res.body.data.total).toBe(0);
  });

  it("validates required fields on create", async () => {
    mockAuth();
    const res = await request(app).post("/api/v1/assets").set("Authorization", authToken).send({});
    expect(res.status).toBe(400);
  });

  it("creates an asset", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "a-1", name: "Dell Laptop", asset_type: "laptop", status: "active" },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/assets")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, name: "Dell Laptop" });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Dell Laptop");
  });

  it("returns 404 for non-existent asset", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const res = await request(app)
      .get("/api/v1/assets/00000000-0000-0000-0000-000000000999")
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("returns csv export", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
    const res = await request(app).get("/api/v1/assets/export").set("Authorization", authToken);
    expect(res.status).toBe(200);
  });
});

describe("Asset tenant isolation (QW-1 / Phase 1)", () => {
  const ORG_A = "00000000-0000-0000-0000-000000000001";
  const ORG_B = "00000000-0000-0000-0000-000000000002";
  const ASSET_ID = "00000000-0000-0000-0000-0000000000a1";

  function mockAsset(orgId: string, extra: Record<string, unknown> = {}) {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: ASSET_ID, organization_id: orgId, version: 1, name: "Asset", ...extra },
        error: null,
      }),
    );
    return supabase;
  }

  it("PATCH /:id succeeds when the asset belongs to the caller's org", async () => {
    mockAsset(ORG_A);
    const res = await request(app)
      .patch(`/api/v1/assets/${ASSET_ID}`)
      .set("Authorization", authToken)
      .send({ name: "Renamed" });
    expect(res.status).toBe(200);
    expect(res.body.data.organization_id).toBe(ORG_A);
  });

  it("PATCH /:id returns 404 when the asset is in another org", async () => {
    mockAsset(ORG_B);
    const res = await request(app)
      .patch(`/api/v1/assets/${ASSET_ID}`)
      .set("Authorization", authToken)
      .send({ name: "Renamed" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id succeeds when the asset belongs to the caller's org", async () => {
    mockAsset(ORG_A);
    const res = await request(app)
      .delete(`/api/v1/assets/${ASSET_ID}`)
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });

  it("DELETE /:id returns 404 when the asset is in another org", async () => {
    mockAsset(ORG_B);
    const res = await request(app)
      .delete(`/api/v1/assets/${ASSET_ID}`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("GET /:id/comments returns 404 when the parent asset is in another org", async () => {
    mockAsset(ORG_B);
    const res = await request(app)
      .get(`/api/v1/assets/${ASSET_ID}/comments`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("POST /:id/comments returns 404 when the parent asset is in another org", async () => {
    mockAsset(ORG_B);
    const res = await request(app)
      .post(`/api/v1/assets/${ASSET_ID}/comments`)
      .set("Authorization", authToken)
      .send({ body: "hi" });
    expect(res.status).toBe(404);
  });

  it("GET /:id/timeline returns 404 when the parent asset is in another org", async () => {
    mockAsset(ORG_B);
    const res = await request(app)
      .get(`/api/v1/assets/${ASSET_ID}/timeline`)
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });
});
