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

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

const mockRequireOrgAccess = jest.fn();

jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (req: unknown, res: unknown, next: () => void) =>
    mockRequireOrgAccess(req, res, next),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/permissions", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import notificationPreferencesRouter from "../routes/notification-preferences";

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
 * mirrors production by injecting req.orgId / req.query.organization_id, which
 * the PUT handler defaults organization_id from (NOTIF-P1-004). Enforcement
 * itself is covered by the dedicated middleware-*.test.ts suites.
 */
const app = createTestApp();
app.use("/api/v1/notification-preferences", notificationPreferencesRouter);
app.use(errorHandler);

describe("Notification Preferences API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireOrgAccess.mockImplementation(createOrgAccessStub(testOrgId).requireOrgAccess);
  });

  it("returns empty preferences list", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
    const res = await request(app)
      .get("/api/v1/notification-preferences")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.preferences).toEqual([]);
    expect(res.body.data.modules).toContain("tickets");
    expect(res.body.data.channels).toContain("email");
  });

  it("returns modules and channels arrays", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
    const res = await request(app)
      .get("/api/v1/notification-preferences")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.modules)).toBe(true);
    expect(Array.isArray(res.body.data.channels)).toBe(true);
    expect(res.body.data.modules.length).toBeGreaterThan(0);
    expect(res.body.data.channels.length).toBeGreaterThan(0);
  });

  it("validates moduleKey enum on update", async () => {
    mockAuth();
    const res = await request(app)
      .put("/api/v1/notification-preferences")
      .set("Authorization", authToken)
      .send({
        preferences: [{ moduleKey: "invalid_module", channel: "email", enabled: true }],
      });
    expect(res.status).toBe(400);
  });

  it("validates channel enum on update", async () => {
    mockAuth();
    const res = await request(app)
      .put("/api/v1/notification-preferences")
      .set("Authorization", authToken)
      .send({
        preferences: [{ moduleKey: "tickets", channel: "invalid_channel", enabled: true }],
      });
    expect(res.status).toBe(400);
  });

  it("creates preferences via upsert with the explicit organizationId", async () => {
    const supabase = mockAuth();
    const builder = createMockBuilder({
      data: { id: "pref-1", module_key: "tickets", channel: "email", enabled: true },
      error: null,
    });
    supabase.from.mockReturnValue(builder);
    const res = await request(app)
      .put("/api/v1/notification-preferences")
      .set("Authorization", authToken)
      .send({
        organizationId: testOrgId,
        preferences: [{ moduleKey: "tickets", channel: "email", enabled: true }],
      });
    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(1);
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: testOrgId,
        user_id: "user-1",
        module_key: "tickets",
        channel: "email",
        enabled: true,
      }),
      { onConflict: "organization_id,user_id,module_key,channel" },
    );
  });

  it("defaults organization_id from the resolved org when the client omits it", async () => {
    const supabase = mockAuth();
    const builder = createMockBuilder({
      data: { id: "pref-2", module_key: "billing", channel: "in_app", enabled: false },
      error: null,
    });
    supabase.from.mockReturnValue(builder);
    const res = await request(app)
      .put("/api/v1/notification-preferences")
      .set("Authorization", authToken)
      .send({
        preferences: [{ moduleKey: "billing", channel: "in_app", enabled: false }],
      });
    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(1);
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: testOrgId,
        user_id: "user-1",
        module_key: "billing",
        channel: "in_app",
        enabled: false,
      }),
      { onConflict: "organization_id,user_id,module_key,channel" },
    );
  });

  it("rejects the update when no organization can be resolved", async () => {
    mockRequireOrgAccess.mockImplementation((req: any, _res: unknown, next: () => void) => {
      req.orgScope = { orgId: null, explicit: false, platformAdmin: false, impersonation: false };
      req.orgId = null;
      next();
    });
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const res = await request(app)
      .put("/api/v1/notification-preferences")
      .set("Authorization", authToken)
      .send({
        preferences: [{ moduleKey: "tickets", channel: "email", enabled: true }],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("validates empty preferences array", async () => {
    mockAuth();
    const res = await request(app)
      .put("/api/v1/notification-preferences")
      .set("Authorization", authToken)
      .send({ preferences: [] });
    expect(res.status).toBe(400);
  });
});
