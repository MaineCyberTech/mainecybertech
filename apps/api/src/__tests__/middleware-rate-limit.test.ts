import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import {
  emailRateLimitKey,
  rateLimitAdminOps,
  rateLimitAuth,
  rateLimitByUser,
  rateLimitSearch,
  rateLimitShare,
  shareRateLimitKey,
  userRateLimitKeyGenerator,
} from "../middleware/rate-limit";

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

describe("rateLimitSearch", () => {
  function createSearchApp() {
    const app = express();
    app.use(rateLimitSearch);
    app.get("/test", (_req, res) => res.json({ ok: true }));
    return app;
  }

  it("caps typeahead bursts per token [SEARCH-P2-007]", async () => {
    const app = createSearchApp();
    let limited = 0;
    for (let i = 0; i < 61; i++) {
      const res = await request(app).get("/test").set("Authorization", "Bearer burst-token");
      if (res.status === 429) limited++;
    }
    expect(limited).toBe(1);
  }, 30000);

  it("keeps a separate bucket per token", async () => {
    const app = createSearchApp();
    for (let i = 0; i < 61; i++) {
      await request(app).get("/test").set("Authorization", "Bearer token-a");
    }
    const otherUser = await request(app).get("/test").set("Authorization", "Bearer token-b");
    expect(otherUser.status).toBe(200);
  }, 30000);
});

describe("rateLimitShare (FILE-P3-001)", () => {
  // Mount the limiter on the route (like the real router does) so req.params
  // is populated when the key generator runs.
  function createShareApp() {
    const app = express();
    app.get("/share/:token", rateLimitShare, (_req, res) => res.json({ ok: true }));
    return app;
  }

  it("keys the bucket by sha256(token), not the raw token", () => {
    const key = shareRateLimitKey("raw-share-token");
    expect(key).toMatch(/^[0-9a-f]{32}$/);
    expect(key).not.toContain("raw-share-token");
    expect(shareRateLimitKey("raw-share-token")).toBe(key);
    expect(shareRateLimitKey("other")).not.toBe(key);
  });

  it("caps a hot share token at 30 requests/minute", async () => {
    const app = createShareApp();
    let limited = 0;
    for (let i = 0; i < 31; i++) {
      const res = await request(app).get("/share/hot-token");
      if (res.status === 429) limited++;
    }
    expect(limited).toBe(1);
  }, 30000);

  it("keeps a separate bucket per token", async () => {
    const app = createShareApp();
    for (let i = 0; i < 31; i++) {
      await request(app).get("/share/busy-token");
    }
    const other = await request(app).get("/share/quiet-token");
    expect(other.status).toBe(200);
  }, 30000);
});

describe("rateLimitAdminOps", () => {
  function createAdminOpsApp() {
    const app = express();
    app.use(rateLimitAdminOps);
    app.get("/test", (_req, res) => res.json({ ok: true }));
    return app;
  }

  it("caps destructive/expensive admin-op bursts per token [ADMIN-P2-005]", async () => {
    const app = createAdminOpsApp();
    let limited = 0;
    for (let i = 0; i < 20; i++) {
      const res = await request(app)
        .get("/test")
        .set("Authorization", "Bearer admin-op-burst-token");
      if (res.status === 429) limited++;
    }
    // max = 10/min: calls 11-20 are rejected (matches the report's
    // "20 rapid calls → 429" manual verification).
    expect(limited).toBe(10);
  }, 30000);

  it("keeps a separate bucket per token", async () => {
    const app = createAdminOpsApp();
    for (let i = 0; i < 11; i++) {
      await request(app).get("/test").set("Authorization", "Bearer busy-admin-token");
    }
    const otherUser = await request(app)
      .get("/test")
      .set("Authorization", "Bearer other-admin-token");
    expect(otherUser.status).toBe(200);
  }, 30000);
});

describe("userRateLimitKeyGenerator", () => {
  it("keys by a hash of the full token (claims are unverified at this point)", () => {
    const tokenA = makeJwt("user-1");
    const tokenB = makeJwt("user-2");
    const keyA = userRateLimitKeyGenerator(`Bearer ${tokenA}`, "1.2.3.4");
    expect(keyA).toMatch(/^user:[0-9a-f]{32}$/);
    expect(keyA).not.toBe(userRateLimitKeyGenerator(`Bearer ${tokenB}`, "1.2.3.4"));
    // A forged token with a different signature gets a different bucket too,
    // so rotating unverified `sub` values does not mint unlimited buckets.
    expect(keyA).not.toBe(
      userRateLimitKeyGenerator(`Bearer ${makeJwt("user-1", { jti: "x" })}`, "1.2.3.4"),
    );
  });

  it("produces the SAME key for the same token across requests", () => {
    const token = makeJwt("user-1");
    const keyA = userRateLimitKeyGenerator(`Bearer ${token}`, "1.2.3.4");
    const keyB = userRateLimitKeyGenerator(`Bearer ${token}`, "1.2.3.4");
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

describe("emailRateLimitKey [SEC-P3-003]", () => {
  it("normalizes case and whitespace to one hashed bucket", () => {
    const a = emailRateLimitKey("User@Example.com");
    const b = emailRateLimitKey("user@example.com");
    const c = emailRateLimitKey("  USER@example.com ");
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    // the limiter must not hold the plaintext address as a key
    expect(a).not.toContain("user");
  });

  it("ignores missing or blank emails", () => {
    expect(emailRateLimitKey(undefined)).toBeUndefined();
    expect(emailRateLimitKey("   ")).toBeUndefined();
    expect(emailRateLimitKey(42)).toBeUndefined();
  });

  it("keeps distinct addresses in distinct buckets", () => {
    expect(emailRateLimitKey("a@example.com")).not.toBe(emailRateLimitKey("b@example.com"));
  });
});

describe("rateLimitAuth email-key normalization [SEC-P3-003]", () => {
  function createAuthApp() {
    const app = express();
    app.use(express.json());
    app.use(rateLimitAuth);
    app.post("/test", (_req, res) => res.json({ ok: true }));
    return app;
  }

  it("shares one bucket across case/whitespace variants", async () => {
    const app = createAuthApp();
    let limited = 0;
    // max = 10/15min. 6 + 5 requests across the variants are only capped at
    // the 11th request when both normalize to the same bucket.
    for (let i = 0; i < 6; i++) {
      const res = await request(app).post("/test").send({ email: "Victim@Example.com" });
      if (res.status === 429) limited++;
    }
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post("/test").send({ email: " victim@example.com " });
      if (res.status === 429) limited++;
    }
    expect(limited).toBe(1);
  }, 30000);
});
