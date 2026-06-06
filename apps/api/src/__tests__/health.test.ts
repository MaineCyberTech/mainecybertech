import { jest } from "@jest/globals";
import request from "supertest";
import healthRouter from "../routes/health";
import { createTestApp } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  
}));

import { getSupabaseAdmin } from "../services/supabase";

const app = createTestApp();
app.use("/health", healthRouter);
app.use(errorHandler);

describe("health check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns healthy when database is accessible", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ error: null }),
      }),
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("healthy");
    expect(res.body.data.checks.database.status).toBe("healthy");
    expect(res.body.data.checks.database.latencyMs).toBeDefined();
    expect(res.body.data.uptime).toBeDefined();
  });

  it("returns 503 when database is unreachable", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Connection refused")),
      }),
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.data.status).toBe("degraded");
    expect(res.body.data.checks.database.status).toBe("unhealthy");
  });

  it("returns 503 when database returns error", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ error: { message: "relation not found" } }),
      }),
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.data.checks.database.status).toBe("unhealthy");
  });
});
