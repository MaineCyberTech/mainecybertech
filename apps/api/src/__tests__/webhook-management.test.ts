import { jest } from "@jest/globals";
import request from "supertest";
import webhookManagementRouter from "../routes/webhook-management";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test", SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key", SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*", LOG_LEVEL: "silent", API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";

function mockAuth() {
  const supabase: any = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "admin-1", email: "admin@test.com" } }, error: null });
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/webhook-endpoints", webhookManagementRouter);
app.use(errorHandler);

describe("webhook-management routes", () => {
  let supabase: any;

  beforeEach(() => { supabase = mockAuth(); jest.clearAllMocks(); });

  it("GET / lists webhook endpoints", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [{ id: "wh1", name: "Test" }], error: null } as MockResult));
    const res = await request(app).get("/api/v1/webhook-endpoints").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET / masks secret in response", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: { id: "wh1", name: "Test", secret: "my-super-secret-key-12345" }, error: null } as MockResult));
    const res = await request(app).get("/api/v1/webhook-endpoints/wh1").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.secret).toBe("my-s****2345");
    expect(res.body.data.secret).not.toContain("super-secret-key");
  });

  it("GET /:id returns single endpoint", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: { id: "wh1", name: "Test" }, error: null } as MockResult));
    const res = await request(app).get("/api/v1/webhook-endpoints/wh1").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /:id/deliveries returns delivery log", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 } as MockResult));
    const res = await request(app).get("/api/v1/webhook-endpoints/wh1/deliveries").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET / returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/webhook-endpoints");
    expect(res.status).toBe(401);
  });

  it("POST / rejects webhook URLs pointing at private/loopback hosts (SSRF)", async () => {
    // requireAdmin: memberships lookup returns an admin membership
    const adminSupabase = mockAuth();
    adminSupabase.from.mockReturnValue(
      createMockBuilder({
        data: [{ id: "m1", roles: { id: "r1", key: "admin" } }],
        error: null,
      } as MockResult),
    );

    const res = await request(app)
      .post("/api/v1/webhook-endpoints")
      .set("Authorization", "Bearer token")
      .send({
        organizationId: "00000000-0000-0000-0000-000000000001",
        name: "Internal hook",
        url: "http://169.254.169.254/latest/meta-data",
        events: ["ticket.created"],
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("VALIDATION");
    expect(adminSupabase.from).not.toHaveBeenCalledWith("webhook_endpoints");
  });

  it("POST / rejects non-http(s) webhook schemes", async () => {
    const adminSupabase = mockAuth();
    adminSupabase.from.mockReturnValue(
      createMockBuilder({
        data: [{ id: "m1", roles: { id: "r1", key: "admin" } }],
        error: null,
      } as MockResult),
    );

    const res = await request(app)
      .post("/api/v1/webhook-endpoints")
      .set("Authorization", "Bearer token")
      .send({
        organizationId: "00000000-0000-0000-0000-000000000001",
        name: "Redis hook",
        url: "redis://127.0.0.1:6379",
        events: ["ticket.created"],
      });

    expect(res.status).toBe(400);
  });
});
