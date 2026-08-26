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
    SMTP_PORT: 587,
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
import findingsRouter from "../routes/findings";

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
jest.mock("../middleware/require-active-subscription", () => ({
  requireActiveSubscription: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = createTestApp();
app.use("/api/v1/findings", findingsRouter);
app.use(errorHandler);

describe("Findings API", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET /api/v1/findings", () => {
    it("returns empty list", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
      const res = await request(app).get("/api/v1/findings").set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });
  });

  describe("GET /api/v1/findings/stats", () => {
    it("returns stats", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
      const res = await request(app).get("/api/v1/findings/stats").set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("bySeverity");
      expect(res.body.data).toHaveProperty("total");
    });
  });

  describe("POST /api/v1/findings", () => {
    it("validates required fields", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/findings")
        .set("Authorization", authToken)
        .send({});
      expect(res.status).toBe(400);
    });

    it("creates a finding", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { id: "f-1", title: "Test Finding", severity: "p2", status: "open" },
          error: null,
        }),
      );
      const res = await request(app)
        .post("/api/v1/findings")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId, title: "Test Finding", severity: "p2" });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Test Finding");
    });
  });

  describe("GET /api/v1/findings/:id", () => {
    it("returns 404", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
      const res = await request(app)
        .get("/api/v1/findings/00000000-0000-0000-0000-000000000999")
        .set("Authorization", authToken);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/v1/findings/:id/resolve", () => {
    it("validates organizationId", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/findings/00000000-0000-0000-0000-000000000060/resolve")
        .set("Authorization", authToken)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/findings/export", () => {
    it("returns csv", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
      const res = await request(app).get("/api/v1/findings/export").set("Authorization", authToken);
      expect(res.status).toBe(200);
    });
  });
});
