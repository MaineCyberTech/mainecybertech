import { jest } from "@jest/globals";
import request from "supertest";
import publicRouter from "../routes/public";
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

import { getSupabaseAdmin } from "../services/supabase";

const app = createTestApp();
app.use("/api/v1/public", publicRouter);
app.use(errorHandler);

function mockSupabase() {
  const supabase: any = { from: jest.fn() };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

describe("public routes", () => {
  let supabase: any;

  beforeEach(() => { supabase = mockSupabase(); jest.clearAllMocks(); });

  it("GET /init returns tracking ID", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null } as MockResult));
    const res = await request(app).get("/api/v1/public/init");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trackingId).toBeDefined();
    expect(typeof res.body.data.trackingId).toBe("string");
  });

  it("POST /submit with valid tracking ID succeeds", async () => {
    const trackingId = crypto.randomUUID();
    supabase.from
      .mockReturnValueOnce(createMockBuilder({ data: [{ id: trackingId, location: "Portland, ME", platform: '"Windows"', ip_address: "1.2.3.4", referrer: "Direct", user_agent: "Mozilla" }], error: null } as MockResult))
      .mockReturnValueOnce(createMockBuilder({ data: null, error: null } as MockResult))
      .mockReturnValue(createMockBuilder({ data: null, error: null } as MockResult));

    const res = await request(app)
      .post("/api/v1/public/submit")
      .send({
        trackingId,
        company: "Test Corp",
        name: "John Doe",
        email: "john@test.com",
        phone: "207-555-0100",
        services: "Managed IT Support",
        employees: "11-50",
        urgency: "Medium - Planning Phase",
        message: "Looking for managed IT services.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /submit with missing tracking ID returns 400", async () => {
    const res = await request(app)
      .post("/api/v1/public/submit")
      .send({ company: "Test", name: "Test", email: "test@test.com", phone: "555", services: "IT", employees: "1", urgency: "Low", message: "Hi" });

    expect(res.status).toBe(400);
  });

  it("POST /submit with invalid tracking ID returns 404", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: { message: "Not found" } } as MockResult));

    const res = await request(app)
      .post("/api/v1/public/submit")
      .send({
        trackingId: "00000000-0000-0000-0000-000000000000",
        company: "Test Corp",
        name: "John Doe",
        email: "john@test.com",
        phone: "207-555-0100",
        services: "Managed IT Support",
        employees: "11-50",
        urgency: "Medium - Planning Phase",
        message: "Looking for managed IT services.",
      });

    expect(res.status).toBe(404);
  });

  it("GET /init returns 500 on DB error", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: { message: "DB connection failed" } } as MockResult));
    const res = await request(app).get("/api/v1/public/init");
    expect(res.status).toBe(500);
  });
});
