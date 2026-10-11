import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";
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
import { csrfProtection } from "../middleware/csrf";
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

/**
 * The route suite mounts the real CSRF gate without the cookie-parser
 * dependency: extract the one cookie the gate reads (csrf_token) the way
 * app.ts's cookie parser would. Keeping this inline avoids CodeQL's
 * cookie-middleware model flagging the test scaffold (the gate under test IS
 * csrfProtection).
 */
function parseCookieHeader(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
) {
  const match = /(?:^|;\s*)csrf_token=([^;]*)/.exec(req.headers.cookie ?? "");
  req.cookies = match ? { csrf_token: decodeURIComponent(match[1]) } : {};
  next();
}

/** The route as mounted behind the real CSRF gate (AN-P2-003). */
function createCsrfApp() {
  const csrfApp = express();
  csrfApp.use(express.json());
  csrfApp.use(parseCookieHeader);
  csrfApp.use(csrfProtection);
  csrfApp.use("/api/v1/analytics", analyticsRouter);
  csrfApp.use(errorHandler);
  return csrfApp;
}

function setCookieHeader(res: { headers: Record<string, unknown> }): string[] {
  return (res.headers["set-cookie"] as string[] | undefined) ?? [];
}

describe("Analytics API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("tracks a public event without auth and without visitor PII", async () => {
    const supabase = mockAuth();
    const builder = createMockBuilder({ data: null, error: null });
    supabase.from.mockReturnValue(builder);

    const res = await request(app)
      .post("/api/v1/analytics/track")
      .send({ event: "page_view", page: "/store" });

    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);

    // AN-P2-002: the insert must not carry the caller's IP or user-agent.
    const inserted = (builder.insert as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(inserted).not.toHaveProperty("ip_address");
    expect(inserted).not.toHaveProperty("user_agent");
    expect(inserted.event).toBe("page_view");
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
    // SEARCH-P2-005: the route must call the RPC the migration now defines.
    expect(supabase.rpc).toHaveBeenCalledWith("get_analytics_summary");
  });
});

describe("Analytics API behind the CSRF gate (AN-P2-003)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("issues a CSRF cookie from the bootstrap endpoint", async () => {
    const res = await request(createCsrfApp()).get("/api/v1/analytics/csrf");

    expect(res.status).toBe(204);
    const cookies = setCookieHeader(res);
    expect(cookies.some((cookie) => cookie.startsWith("csrf_token="))).toBe(true);
  });

  it("accepts a track POST carrying the double-submit token", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

    const csrfApp = createCsrfApp();
    const bootstrap = await request(csrfApp).get("/api/v1/analytics/csrf");
    const csrfCookie = setCookieHeader(bootstrap).find((cookie) =>
      cookie.startsWith("csrf_token="),
    );
    expect(csrfCookie).toBeDefined();
    const csrfToken = csrfCookie!.split(";")[0].split("=")[1];

    const res = await request(csrfApp)
      .post("/api/v1/analytics/track")
      .set("Cookie", csrfCookie!)
      .set("X-CSRF-Token", csrfToken)
      .send({ event: "store_view" });

    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
  });

  it("rejects a track POST without a CSRF token", async () => {
    mockAuth();
    const res = await request(createCsrfApp())
      .post("/api/v1/analytics/track")
      .send({ event: "store_view" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("CSRF_INVALID");
  });
});
