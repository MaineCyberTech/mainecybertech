import { jest } from "@jest/globals";
import request from "supertest";
import notificationsRouter from "../routes/notifications";
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
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1", email: "user@test.com" } }, error: null });
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/notifications", notificationsRouter);
app.use(errorHandler);

describe("notifications routes", () => {
  let supabase: any;

  beforeEach(() => { supabase = mockAuth(); jest.clearAllMocks(); });

  it("GET / lists notifications", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [{ id: "n1", title: "Test" }], error: null, count: 1 } as MockResult));
    const res = await request(app).get("/api/v1/notifications").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("GET /unread-count returns unread count", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 3 } as MockResult));
    const res = await request(app).get("/api/v1/notifications/unread-count").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(3);
  });

  it("POST /:id/read marks notification read", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: { id: "n1", read: true }, error: null } as MockResult));
    const res = await request(app).post("/api/v1/notifications/n1/read").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("POST /mark-all-read marks all read", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null } as MockResult));
    const res = await request(app).post("/api/v1/notifications/mark-all-read").set("Authorization", "Bearer token");
    expect(res.status).toBe(200);
  });

  it("POST / requires admin", async () => {
    const res = await request(app).post("/api/v1/notifications").set("Authorization", "Bearer token").send({
      userId: "u1", title: "Test", body: "Body", module: "tickets", action: "created",
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("DELETE /:id deletes notification", async () => {
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null } as MockResult));
    const res = await request(app).delete("/api/v1/notifications/n1").set("Authorization", "Bearer token");
    expect(res.status).toBe(204);
  });

  it("GET / returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/notifications");
    expect(res.status).toBe(401);
  });
});
