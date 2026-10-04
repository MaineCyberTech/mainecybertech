import { jest } from "@jest/globals";
import request from "supertest";
import healthRouter, { authorizeInternalRequest } from "../routes/health";
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
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()),
  getSupabaseAdminNoBreaker: jest.fn(),
}));

jest.mock("../lib/health", () => ({
  checkRedisHealth: jest.fn().mockResolvedValue({ status: "not_configured" }),
}));

import { getEnv } from "../config/env";
import { getSupabaseAdminNoBreaker } from "../services/supabase";
import { checkRedisHealth } from "../lib/health";

const baseEnv = {
  NODE_ENV: "test",
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  CORS_ORIGIN: "*",
  LOG_LEVEL: "silent",
  API_PORT: 4000,
};

const app = createTestApp();
app.use("/health", healthRouter);
app.use(errorHandler);

describe("health check", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getEnv as jest.Mock).mockReturnValue(baseEnv);
    (checkRedisHealth as jest.Mock).mockResolvedValue({ status: "not_configured" });
  });

  it("returns healthy when database is accessible", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ error: null }),
      }),
    };
    (getSupabaseAdminNoBreaker as jest.Mock).mockReturnValue(supabase);

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("healthy");
    expect(res.body.data.uptime).toBeDefined();
  });

  it("does not disclose checks or provider configuration publicly", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ error: null }),
      }),
    };
    (getSupabaseAdminNoBreaker as jest.Mock).mockReturnValue(supabase);

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.data.checks).toBeUndefined();
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/stripe|jsm|redis|database|not_configured/i);
  });

  it("returns 503 when database is unreachable", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Connection refused")),
      }),
    };
    (getSupabaseAdminNoBreaker as jest.Mock).mockReturnValue(supabase);

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.data.status).toBe("degraded");
    expect(res.body.data.checks).toBeUndefined();
  });

  it("returns 503 when database returns error", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ error: { message: "relation not found" } }),
      }),
    };
    (getSupabaseAdminNoBreaker as jest.Mock).mockReturnValue(supabase);

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body.data.status).toBe("degraded");
  });

  it("does not degrade overall health when redis is unhealthy (optional dependency)", async () => {
    const supabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ error: null }),
      }),
    };
    (getSupabaseAdminNoBreaker as jest.Mock).mockReturnValue(supabase);
    (checkRedisHealth as jest.Mock).mockResolvedValue({
      status: "unhealthy",
      latencyMs: 5,
      error: "connection refused",
    });

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("healthy");
  });

  describe("/health/detail", () => {
    it("404s when METRICS_TOKEN is not configured", async () => {
      const res = await request(app).get("/health/detail");
      expect(res.status).toBe(404);
    });

    it("404s when the token does not match", async () => {
      (getEnv as jest.Mock).mockReturnValue({ ...baseEnv, METRICS_TOKEN: "s3cret" });
      const res = await request(app).get("/health/detail").set("Authorization", "Bearer wrong");
      expect(res.status).toBe(404);
    });

    it("returns full checks when the bearer token matches", async () => {
      (getEnv as jest.Mock).mockReturnValue({ ...baseEnv, METRICS_TOKEN: "s3cret" });
      const supabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ error: null }),
        }),
      };
      (getSupabaseAdminNoBreaker as jest.Mock).mockReturnValue(supabase);

      const res = await request(app).get("/health/detail").set("Authorization", "Bearer s3cret");

      expect(res.status).toBe(200);
      expect(res.body.data.checks.database.status).toBe("healthy");
      expect(res.body.data.checks.redis.status).toBe("not_configured");
      expect(res.body.data.checks.stripe.status).toBe("not_configured");
    });
  });

  describe("authorizeInternalRequest", () => {
    it("fails closed with no configured token", () => {
      const req = { headers: { authorization: "Bearer anything" }, query: {} };
      expect(authorizeInternalRequest(req as never, undefined)).toBe(false);
    });

    it("rejects wrong and missing tokens", () => {
      const req = { headers: {}, query: {} };
      expect(authorizeInternalRequest(req as never, "s3cret")).toBe(false);
      expect(
        authorizeInternalRequest(
          { headers: { authorization: "Bearer nope" }, query: {} } as never,
          "s3cret",
        ),
      ).toBe(false);
    });

    it("accepts the bearer header or ?token=", () => {
      expect(
        authorizeInternalRequest(
          { headers: { authorization: "Bearer s3cret" }, query: {} } as never,
          "s3cret",
        ),
      ).toBe(true);
      expect(
        authorizeInternalRequest(
          { headers: {}, query: { token: "s3cret" } } as never,
          "s3cret",
        ),
      ).toBe(true);
    });
  });
});
