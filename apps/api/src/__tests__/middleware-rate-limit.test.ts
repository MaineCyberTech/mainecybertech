import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import { rateLimitByUser, userRateLimitKeyGenerator } from "../middleware/rate-limit";

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

function makeJwt(sub: string, extraPayload: Record<string, unknown> = {}): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub, ...extraPayload })).toString("base64url");
  return `${header}.${payload}.fake-signature`;
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

describe("userRateLimitKeyGenerator", () => {
  it("keys by JWT sub claim (stable per user)", () => {
    const tokenA = makeJwt("user-1");
    const tokenB = makeJwt("user-2");
    expect(userRateLimitKeyGenerator(`Bearer ${tokenA}`, "1.2.3.4")).toBe("user:user-1");
    expect(userRateLimitKeyGenerator(`Bearer ${tokenB}`, "1.2.3.4")).toBe("user:user-2");
  });

  it("produces the SAME key for the same user on different requests", () => {
    const tokenA = makeJwt("user-1");
    const tokenB = makeJwt("user-1");
    const keyA = userRateLimitKeyGenerator(`Bearer ${tokenA}`, "1.2.3.4");
    const keyB = userRateLimitKeyGenerator(`Bearer ${tokenB}`, "1.2.3.4");
    expect(keyA).toBe(keyB);
  });

  it("does not bucket all users into one global counter (HS256 header is constant)", () => {
    // The first 20 chars of an HS256 JWT are just the constant base64 header.
    const headerOnly = makeJwt("user-1").slice(0, 20);
    const keyA = userRateLimitKeyGenerator(`Bearer ${makeJwt("user-1")}`, "1.2.3.4");
    const keyB = userRateLimitKeyGenerator(`Bearer ${makeJwt("user-2")}`, "1.2.3.4");
    expect(keyA).not.toBe(keyB);
    expect(keyA).not.toContain(headerOnly);
  });

  it("falls back to a full-token hash when the payload is not JSON", () => {
    const malformed = "aaaa.bbbb.cccc";
    const key = userRateLimitKeyGenerator(`Bearer ${malformed}`, "1.2.3.4");
    expect(key).toMatch(/^user:[0-9a-f]{32}$/);
    // deterministic — same token, same key
    expect(userRateLimitKeyGenerator(`Bearer ${malformed}`, "1.2.3.4")).toBe(key);
  });

  it("falls back to IP when no bearer token is present", () => {
    expect(userRateLimitKeyGenerator(undefined, "5.6.7.8")).toBe("ip:5.6.7.8");
    expect(userRateLimitKeyGenerator("Basic dXNlcjpwYXNz", "5.6.7.8")).toBe("ip:5.6.7.8");
  });
});
