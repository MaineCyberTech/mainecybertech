import { jest } from "@jest/globals";
import request from "supertest";
import billingRouter from "../routes/billing";
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
app.use("/api/v1/billing", billingRouter);
app.use(errorHandler);

describe("billing routes", () => {
  let supabase: any;

  beforeEach(() => { supabase = mockAuth(); jest.clearAllMocks(); });

  it("GET /invoices returns paginated invoices", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [{ id: "inv1" }], error: null, count: 1 } as MockResult));
    const res = await request(app).get("/api/v1/billing/invoices").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /subscriptions returns subscriptions", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [{ id: "sub1", plan_name: "Premium" }], error: null } as MockResult));
    const res = await request(app).get("/api/v1/billing/subscriptions").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /payments returns paginated payments", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 } as MockResult));
    const res = await request(app).get("/api/v1/billing/payments").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /billing-customer requires organization_id", async () => {
    const res = await request(app).get("/api/v1/billing/billing-customer").set("Authorization", "Bearer token");
    expect(res.status).toBe(400);
  });

  it("GET / returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/billing/invoices");
    expect(res.status).toBe(401);
  });
});
