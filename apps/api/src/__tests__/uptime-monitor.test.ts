import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
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

// Deterministic DNS for the SSRF guard (public hostnames resolve to a
// public address; private literals are blocked synchronously without DNS).
jest.mock("node:dns", () => ({
  promises: {
    lookup: jest.fn().mockResolvedValue([{ address: "93.184.216.34", family: 4 }]),
  },
}));

import { getSupabaseAdmin } from "../services/supabase";
import uptimeMonitorRouter from "../routes/uptime-monitor";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";

function mockAuth() {
  const supabase = {
    from: jest.fn().mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 })),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
    rpc: jest.fn().mockResolvedValue({ data: { has_access: true }, error: null }),
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/uptime-monitor", uptimeMonitorRouter);
app.use(errorHandler);

describe("Uptime Monitor API", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET /api/v1/uptime-monitor/checks", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/v1/uptime-monitor/checks");
      expect(res.status).toBe(401);
    });

    it("lists checks", async () => {
      mockAuth();
      const res = await request(app)
        .get(`/api/v1/uptime-monitor/checks?organization_id=${testOrgId}`)
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("items");
    });
  });

  describe("POST /api/v1/uptime-monitor/checks", () => {
    it("creates a check", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { id: "c1", url: "https://example.com", status: "active" },
          error: null,
        }),
      );
      const res = await request(app)
        .post("/api/v1/uptime-monitor/checks")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId, url: "https://example.com" });
      expect(res.status).toBe(201);
      expect(res.body.data.url).toBe("https://example.com");
    });

    it("validates required fields", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/uptime-monitor/checks")
        .set("Authorization", authToken)
        .send({});
      expect(res.status).toBe(400);
    });

    it("rejects private/loopback URLs (SSRF)", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/uptime-monitor/checks")
        .set("Authorization", authToken)
        .send({
          organizationId: testOrgId,
          url: "http://169.254.169.254/latest/meta-data",
        });
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe("VALIDATION");
    });

    it("rejects localhost URLs (SSRF)", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/uptime-monitor/checks")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId, url: "http://localhost:3000/health" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/uptime-monitor/checks/:id", () => {
    it("returns a check", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: { id: "c1", url: "https://example.com" }, error: null }),
      );
      const res = await request(app)
        .get("/api/v1/uptime-monitor/checks/c1")
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("c1");
    });

    it("returns 404 for missing check", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
      const res = await request(app)
        .get("/api/v1/uptime-monitor/checks/missing")
        .set("Authorization", authToken);
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/uptime-monitor/checks/:id", () => {
    it("updates a check", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { id: "c1", url: "https://example.com", status: "paused" },
          error: null,
        }),
      );
      const res = await request(app)
        .patch("/api/v1/uptime-monitor/checks/c1")
        .set("Authorization", authToken)
        .send({ status: "paused" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("paused");
    });

    it("rejects private/loopback URLs on update (SSRF)", async () => {
      mockAuth();
      const res = await request(app)
        .patch("/api/v1/uptime-monitor/checks/c1")
        .set("Authorization", authToken)
        .send({ url: "http://10.0.0.1/health" });
      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe("VALIDATION");
    });
  });

  describe("DELETE /api/v1/uptime-monitor/checks/:id", () => {
    it("deletes a check", async () => {
      mockAuth();
      const res = await request(app)
        .delete("/api/v1/uptime-monitor/checks/c1")
        .set("Authorization", authToken);
      expect(res.status).toBe(204);
    });
  });

  describe("GET /api/v1/uptime-monitor/checks/:id/results", () => {
    it("returns results for a check", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: [{ id: "r1", is_up: true }], error: null }),
      );
      const res = await request(app)
        .get("/api/v1/uptime-monitor/checks/c1/results")
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe("GET /api/v1/uptime-monitor/checks/:id/uptime", () => {
    it("returns uptime stats", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: { id: "c1" }, error: null, count: 100 }),
      );
      const res = await request(app)
        .get("/api/v1/uptime-monitor/checks/c1/uptime")
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("7d");
      expect(res.body.data).toHaveProperty("30d");
      expect(res.body.data).toHaveProperty("90d");
    });
  });

  describe("GET /api/v1/uptime-monitor/dashboard", () => {
    it("returns dashboard summary", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
      const res = await request(app)
        .get(`/api/v1/uptime-monitor/dashboard?organization_id=${testOrgId}`)
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("checks");
      expect(res.body.data).toHaveProperty("summary");
    });
  });
});
