import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import { rateLimitByUser } from "../middleware/rate-limit";

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

function createTestApp() {
  const app = express();
  app.use(rateLimitByUser);
  app.get("/test", (_req, res) => res.json({ ok: true }));
  return app;
}

describe("rateLimitByUser", () => {
  it("allows requests within limit", async () => {
    const app = createTestApp();
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
  });

  it("returns rate limit headers", async () => {
    const app = createTestApp();
    const res = await request(app).get("/test");
    expect(res.headers["ratelimit-limit"]).toBeDefined();
    expect(res.headers["ratelimit-remaining"]).toBeDefined();
  });

  it("skips rate limit for health endpoint", async () => {
    const app = express();
    app.use(rateLimitByUser);
    app.get("/health", (_req, res) => res.json({ ok: true }));

    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });
});
