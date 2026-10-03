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
  }),
}));
jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));

// Route-level suite: admin gate is stubbed so mocks serve route queries only.
// Enforcement itself is covered by middleware-admin.test.ts.
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import analyticsRouter from "../routes/analytics";

const authToken = "Bearer test-token";

function mockAuth() {
  const supabase = {
    from: jest.fn(),
    rpc: jest.fn(),
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
app.use("/api/v1/analytics", analyticsRouter);
app.use(errorHandler);

describe("Analytics API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("tracks a public event without auth", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

    const res = await request(app)
      .post("/api/v1/analytics/track")
      .send({ event: "page_view", page: "/store" });

    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
  });

  it("rejects a track payload without an event name", async () => {
    mockAuth();
    const res = await request(app).post("/api/v1/analytics/track").send({ page: "/store" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("lists events for an admin", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({ data: [{ id: "e1", event: "click" }], error: null }),
    );

    const res = await request(app).get("/api/v1/analytics").set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("returns the aggregate summary", async () => {
    const supabase = mockAuth();
    supabase.rpc.mockReturnValue(
      createMockBuilder({ data: [{ event: "click", count: 3 }], error: null }),
    );

    const res = await request(app).get("/api/v1/analytics/summary").set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data[0].count).toBe(3);
  });
});
