import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "production",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
    JWT_SECRET: "test-secret",
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { requireActiveSubscription } from "../middleware/require-active-subscription";

function mockReq(opts: { userId?: string; orgId?: string } = {}) {
  return {
    authUser: opts.userId ? { userId: opts.userId, email: "test@example.com" } : undefined,
    query: opts.orgId ? { organization_id: opts.orgId } : {},
  } as unknown as Request;
}

function mockRes() {
  return { status: jest.fn(), json: jest.fn() } as unknown as Response;
}

function mockSupabaseChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.in = jest.fn().mockReturnValue(chain);
  chain.then = (resolve: (v: unknown) => void) => resolve(result);
  chain.catch = jest.fn();
  return chain;
}

function mockSupabase(opts: { subscriptions?: any[]; memberships?: any[]; error?: any } = {}) {
  const from = jest.fn();

  from.mockImplementation((table: string) => {
    if (table === "subscriptions") {
      const chain: Record<string, unknown> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.in = jest.fn().mockImplementation(() => {
        return {
          then: (resolve: (v: unknown) => void) =>
            resolve({
              data: opts.subscriptions ?? null,
              error: opts.error ?? null,
            }),
          catch: jest.fn(),
        };
      });
      return chain;
    }
    if (table === "memberships") {
      const chain: Record<string, unknown> = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.then = (resolve: (v: unknown) => void) =>
        resolve({
          data: opts.memberships ?? null,
          error: null,
        });
      chain.catch = jest.fn();
      return chain;
    }
    return {};
  });

  return { from };
}

describe("requireActiveSubscription middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows requests with an active subscription", async () => {
    const mock = mockSupabase({ subscriptions: [{ id: "sub-1", status: "active" }] });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);

    const req = mockReq({ userId: "user-1", orgId: "org-1" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("allows requests with a trialing subscription", async () => {
    const mock = mockSupabase({ subscriptions: [{ id: "sub-2", status: "trialing" }] });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);

    const req = mockReq({ userId: "user-1", orgId: "org-1" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("blocks requests without an active subscription for non-admin users", async () => {
    const mock = mockSupabase({
      subscriptions: [],
      memberships: [
        { id: "mem-1", roles: { id: "role-1", key: "member" } },
      ],
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);

    const req = mockReq({ userId: "user-1", orgId: "org-1" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SUBSCRIPTION_REQUIRED", status: 403 }),
    );
  });

  it("allows admin users to bypass subscription check", async () => {
    const mock = mockSupabase({
      subscriptions: [],
      memberships: [
        { id: "mem-1", roles: { id: "role-1", key: "admin" } },
      ],
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);

    const req = mockReq({ userId: "user-1", orgId: "org-1" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("allows super_admin users to bypass subscription check", async () => {
    const mock = mockSupabase({
      subscriptions: [],
      memberships: [
        { id: "mem-1", roles: { id: "role-1", key: "super_admin" } },
      ],
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);

    const req = mockReq({ userId: "user-1", orgId: "org-1" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("throws 401 if no auth user", async () => {
    const mock = mockSupabase({ subscriptions: [] });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);

    const req = mockReq({}) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: "UNAUTHORIZED", status: 401 }),
    );
  });

  it("throws 400 if no organization_id in query", async () => {
    const mock = mockSupabase({ subscriptions: [] });
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);

    const req = mockReq({ userId: "user-1" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireActiveSubscription(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: "VALIDATION", status: 400 }),
    );
  });
});
