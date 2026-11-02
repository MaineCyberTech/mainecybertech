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

// MT-P2-008: the admin analytics list/summary are platform-wide surfaces gated
// on resolveAdminTenantScope().allTenants; route tests run cross-tenant unless
// a test overrides the scope.
jest.mock("../lib/admin-scope", () => ({
  ...jest.requireActual("../lib/admin-scope"),
  resolveAdminTenantScope: jest.fn().mockResolvedValue({ allTenants: true, orgIds: [] }),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { csrfProtection } from "../middleware/csrf";
import { resolveAdminTenantScope } from "../lib/admin-scope";
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
      .send({ event: "store_view", page: "/store" });

    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);

    // AN-P2-002: the insert must not carry the caller's IP or user-agent.
    const inserted = (builder.insert as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(inserted).not.toHaveProperty("ip_address");
    expect(inserted).not.toHaveProperty("user_agent");
    expect(inserted.event).toBe("store_view");
  });

  it("rejects a track payload without an event name", async () => {
    mockAuth();
    const res = await request(app).post("/api/v1/analytics/track").send({ page: "/store" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
  });

  // AN-P3-006: arbitrary event names skewed the summary RPC and bypassed the
  // documented registry, so the server enforces the shared vocabulary.
  it("rejects an event name outside the registry", async () => {
    const supabase = mockAuth();
    const builder = createMockBuilder({ data: null, error: null });
    supabase.from.mockReturnValue(builder);

    const res = await request(app)
      .post("/api/v1/analytics/track")
      .send({ event: "totally_made_up_event", page: "/store" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION");
    expect(builder.insert).not.toHaveBeenCalled();
  });

  it("sanitises metadata: drops PII-shaped keys, truncates and caps values", async () => {
    const supabase = mockAuth();
    const builder = createMockBuilder({ data: null, error: null });
    supabase.from.mockReturnValue(builder);

    const metadata: Record<string, unknown> = {
      email: "visitor@example.com",
      session_token: "secret-token",
      plan: "pro",
      note: "x".repeat(500),
      // Non-scalar + null values exercise the stringify/pass-through branches.
      extra: { tier: 2 },
      nothing: null,
    };
    for (let i = 0; i < 40; i++) metadata[`k${i}`] = i;

    const res = await request(app)
      .post("/api/v1/analytics/track")
      .send({ event: "product_detail_view", metadata });

    expect(res.status).toBe(200);
    const inserted = (builder.insert as jest.Mock).mock.calls[0][0] as {
      metadata: Record<string, unknown>;
    };
    expect(inserted.metadata).not.toHaveProperty("email");
    expect(inserted.metadata).not.toHaveProperty("session_token");
    expect(inserted.metadata.plan).toBe("pro");
    expect(String(inserted.metadata.note)).toHaveLength(200);
    expect(inserted.metadata.extra).toBe('{"tier":2}');
    expect(inserted.metadata.nothing).toBeNull();
    expect(Object.keys(inserted.metadata).length).toBeLessThanOrEqual(25);
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

  it("denies a single-org admin the platform-wide event list (MT-P2-008)", async () => {
    mockAuth();
    (resolveAdminTenantScope as jest.Mock).mockResolvedValueOnce({
      allTenants: false,
      orgIds: ["00000000-0000-0000-0000-000000000001"],
    });

    const res = await request(app).get("/api/v1/analytics").set("Authorization", authToken);

    expect(res.status).toBe(403);
  });

  it("denies a single-org admin the platform-wide summary (MT-P2-008)", async () => {
    const supabase = mockAuth();
    (resolveAdminTenantScope as jest.Mock).mockResolvedValueOnce({
      allTenants: false,
      orgIds: ["00000000-0000-0000-0000-000000000001"],
    });

    const res = await request(app)
      .get("/api/v1/analytics/summary")
      .set("Authorization", authToken);

    expect(res.status).toBe(403);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("calls the get_analytics_summary RPC defined by migration 5302440 (SEC-P2-011)", async () => {
    const supabase = mockAuth();
    supabase.rpc.mockReturnValue(createMockBuilder({ data: [], error: null }));

    const res = await request(app).get("/api/v1/analytics/summary").set("Authorization", authToken);

    expect(res.status).toBe(200);
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
