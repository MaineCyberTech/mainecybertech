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
});
