import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";
import { invalidateCache } from "../middleware/cache";

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
import slaRouter from "../routes/sla";

const authToken = "Bearer test-token";

function mockAuth() {
  const supabase = {
    from: jest.fn().mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 })),
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

const app = createTestApp();
app.use("/api/v1/sla", slaRouter);
app.use(errorHandler);

describe("SLA API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  it("returns empty metrics when no logs exist", async () => {
    mockAuth();
    const res = await request(app).get("/api/v1/sla/metrics").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("summary");
    expect(res.body.data).toHaveProperty("byMetric");
    expect(res.body.data).toHaveProperty("recent");
    expect(res.body.data.summary.total).toBe(0);
  });

  it("returns metrics with summary counts", async () => {
    const supabase = mockAuth();
    const logs = [
      {
        metric: "first_response",
        breached: true,
        actual_minutes: 30,
        resolved_at: null,
        created_at: new Date().toISOString(),
      },
      {
        metric: "first_response",
        breached: false,
        actual_minutes: 10,
        resolved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        metric: "resolution",
        breached: false,
        actual_minutes: 120,
        resolved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];
    supabase.from.mockReturnValue(createMockBuilder({ data: logs, error: null, count: 3 }));
    const res = await request(app).get("/api/v1/sla/metrics").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.summary).toHaveProperty("total");
    expect(res.body.data.summary.total).toBe(3);
    expect(res.body.data.summary.breached).toBe(1);
    expect(res.body.data.summary.resolved).toBe(2);
    expect(res.body.data.recent).toHaveLength(3);
  });

  it("clamps days parameter", async () => {
    mockAuth();
    const res = await request(app)
      .get("/api/v1/sla/metrics?days=200")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get("/api/v1/sla/metrics");
    expect(res.status).toBe(401);
  });
});
