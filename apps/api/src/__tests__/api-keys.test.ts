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

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import apiKeysRouter from "../routes/api-keys";

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
app.use("/api/v1/api-keys", apiKeysRouter);
app.use(errorHandler);

describe("API Keys API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists API keys for organization", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: [{ id: "k-1", name: "Test Key", key_prefix: "mct_abc12345", is_active: true }],
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/api-keys?organization_id=" + testOrgId)
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("validates required fields on create", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/api-keys")
      .set("Authorization", authToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it("creates API key and returns fullKey", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "k-2",
          name: "New Key",
          key_prefix: "mct_xyz",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/api-keys")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, name: "New Key" });
    expect(res.status).toBe(201);
    expect(res.body.data.fullKey).toBeDefined();
    expect(res.body.data.fullKey).toMatch(/^mct_/);
  });

  it("updates API key", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "k-1", name: "Updated Key", is_active: false },
        error: null,
      }),
    );
    const res = await request(app)
      .patch("/api/v1/api-keys/k-1")
      .set("Authorization", authToken)
      .send({ isActive: false });
    expect(res.status).toBe(200);
  });

  it("deletes API key", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const res = await request(app).delete("/api/v1/api-keys/k-1").set("Authorization", authToken);
    expect(res.status).toBe(204);
  });
});
