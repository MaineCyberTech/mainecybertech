import { jest } from "@jest/globals";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
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
    JWT_SECRET: "test-secret",
  }),
}));

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { getSupabaseAdmin } from "../services/supabase";
import {
  requireEntitlement,
  requireActiveSubscription,
  clearEntitlementCache,
} from "../middleware/entitlement";

const ORG = "00000000-0000-0000-0000-000000000001";

/**
 * Seed supabase.from with ordered results. Order of calls made by the
 * middleware for a non-admin request:
 *   1. profiles (is_super_admin)                     [resolveEffectivePermissions]
 *   2. memberships (role lookup)
 *   3. role_permissions    ┐ Promise.all
 *   4. user_permission_overrides ┘
 *   5. subscriptions                                 [resolveOrgEntitlements]
 *   6. client_portal_entitlements
 * Calls beyond the seeded list fall back to an empty result.
 */
const EMPTY = { data: [], error: null } as MockResult;

function mockSupabase(results: MockResult[]) {
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  for (const r of results) {
    supabase.from.mockReturnValueOnce(createMockBuilder(r));
  }
  supabase.from.mockReturnValue(createMockBuilder(EMPTY));
  return supabase;
}

/** Seed the two permission-resolution calls that precede entitlement reads. */
function prefixed(rolePerms: MockResult, subs: MockResult, entitlements: MockResult): MockResult[] {
  return [rolePerms, EMPTY, subs, entitlements];
}

function membership(roleKey: string) {
  return {
    id: "m-1",
    organization_id: ORG,
    role_id: "role-1",
    status: "approved",
    roles: { key: roleKey },
  };
}

const NOT_SUPER = { data: { id: "u1", is_super_admin: false }, error: null };

function makeApp(middleware: express.RequestHandler) {
  const app = createTestApp();
  const router = express.Router();
  router.use((req: Request, _res: Response, next: NextFunction) => {
    req.authUser = { userId: "user-1", email: "test@example.com" };
    req.orgId = ORG;
    next();
  });
  router.get("/gated", middleware, (_req, res) => {
    res.json({ success: true, data: { ok: true } });
  });
  app.use("/api/v1/test", router);
  app.use(errorHandler);
  return app;
}

describe("requireEntitlement middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearEntitlementCache();
  });

  it("allows an active-subscription org access to a gated module", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      ...prefixed(
        EMPTY,
        { data: [{ status: "active", updated_at: "2026-01-01" }], error: null },
        EMPTY,
      ),
    ]);

    const res = await request(makeApp(requireEntitlement("findings"))).get("/api/v1/test/gated");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ ok: true });
  });

  it("allows a trialing org access to a gated module", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      ...prefixed(
        EMPTY,
        { data: [{ status: "trialing", updated_at: "2026-01-01" }], error: null },
        EMPTY,
      ),
    ]);

    const res = await request(makeApp(requireEntitlement("qbr"))).get("/api/v1/test/gated");
    expect(res.status).toBe(200);
  });

  it("denies with 402 PAYMENT_REQUIRED when the subscription is canceled", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      ...prefixed(
        EMPTY,
        { data: [{ status: "canceled", updated_at: "2026-01-01" }], error: null },
        EMPTY,
      ),
    ]);

    const res = await request(makeApp(requireEntitlement("findings"))).get("/api/v1/test/gated");
    expect(res.status).toBe(402);
    expect(res.body.error?.code).toBe("PAYMENT_REQUIRED");
    expect(res.body.error?.details?.moduleKey).toBe("findings");
  });

  it("denies with 402 for a past_due org", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      ...prefixed(
        EMPTY,
        { data: [{ status: "past_due", updated_at: "2026-01-01" }], error: null },
        EMPTY,
      ),
    ]);

    const res = await request(makeApp(requireEntitlement("security-ops"))).get("/api/v1/test/gated");
    expect(res.status).toBe(402);
  });

  it("denies with 402 when the org has no subscription at all", async () => {
    mockSupabase([NOT_SUPER, { data: [membership("client_user")], error: null }, ...prefixed(EMPTY, EMPTY, EMPTY)]);

    const res = await request(makeApp(requireEntitlement("governance"))).get("/api/v1/test/gated");
    expect(res.status).toBe(402);
  });

  it("grants a gated module when an admin provisioned it despite no active subscription", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      ...prefixed(
        EMPTY,
        { data: [{ status: "canceled", updated_at: "2026-01-01" }], error: null },
        { data: [{ module_key: "findings", enabled: true }], error: null },
      ),
    ]);

    const res = await request(makeApp(requireEntitlement("findings"))).get("/api/v1/test/gated");
    expect(res.status).toBe(200);
  });

  it("always allows default (non-gated) modules without an active subscription", async () => {
    mockSupabase([NOT_SUPER, { data: [membership("client_user")], error: null }, ...prefixed(EMPTY, EMPTY, EMPTY)]);

    const res = await request(makeApp(requireEntitlement("dashboard"))).get("/api/v1/test/gated");
    expect(res.status).toBe(200);
  });

  it("bypasses the plan gate for admin-role memberships", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("admin")], error: null },
    ]);

    const res = await request(makeApp(requireEntitlement("findings"))).get("/api/v1/test/gated");
    expect(res.status).toBe(200);
  });

  it("bypasses the plan gate for super_admin profiles", async () => {
    mockSupabase([{ data: { id: "u1", is_super_admin: true }, error: null }]);

    const res = await request(makeApp(requireEntitlement("findings"))).get("/api/v1/test/gated");
    expect(res.status).toBe(200);
  });

  it("FAILS OPEN when entitlement resolution errors (transient DB failure)", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      ...prefixed(EMPTY, { data: null, error: { message: "boom" } }, EMPTY),
    ]);

    const res = await request(makeApp(requireEntitlement("findings"))).get("/api/v1/test/gated");
    expect(res.status).toBe(200);
  });

  it("returns 401 without an authenticated user", async () => {
    mockSupabase([]);
    const app = createTestApp();
    const router = express.Router();
    // No auth-injection middleware: req.authUser stays undefined.
    router.get("/gated", requireEntitlement("findings"), (_req, res) => {
      res.json({ success: true });
    });
    app.use("/api/v1/test", router);
    app.use(errorHandler);

    const res = await request(app).get("/api/v1/test/gated");
    expect(res.status).toBe(401);
  });
});

describe("requireActiveSubscription middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearEntitlementCache();
  });

  it("allows an active subscription", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      ...prefixed(
        EMPTY,
        { data: [{ status: "active", updated_at: "2026-01-01" }], error: null },
        EMPTY,
      ),
    ]);

    const res = await request(makeApp(requireActiveSubscription())).get("/api/v1/test/gated");
    expect(res.status).toBe(200);
  });

  it("denies when the subscription is not active", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      ...prefixed(
        EMPTY,
        { data: [{ status: "unpaid", updated_at: "2026-01-01" }], error: null },
        EMPTY,
      ),
    ]);

    const res = await request(makeApp(requireActiveSubscription())).get("/api/v1/test/gated");
    expect(res.status).toBe(402);
    expect(res.body.error?.code).toBe("PAYMENT_REQUIRED");
  });
});
