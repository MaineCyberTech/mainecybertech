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
import { requireOrgAccess, requireOrgAccessByParam } from "../middleware/org-access";

function mockReq(
  opts: {
    userId?: string;
    orgId?: string;
    bodyOrgId?: string;
    paramsId?: string;
  } = {},
) {
  return {
    authUser: opts.userId ? { userId: opts.userId, email: "test@example.com" } : undefined,
    query: opts.orgId ? { organization_id: opts.orgId } : {},
    body: opts.bodyOrgId ? { organizationId: opts.bodyOrgId } : {},
    params: opts.paramsId ? { id: opts.paramsId } : {},
    headers: {},
    cookies: {},
  } as unknown as Request;
}

function mockRes() {
  return { status: jest.fn(), json: jest.fn() } as unknown as Response;
}

function mockSupabase(
  opts: {
    membershipRow?: Record<string, unknown> | null;
    allMemberships?: Array<Record<string, unknown>>;
    primaryMembership?: Record<string, unknown> | null;
    error?: unknown;
  } = {},
) {
  const mock = {
    from: jest.fn(),
  };

  const resolvedChain = (data: unknown, error: unknown = null) => {
    const result = { data, error };
    const chain: Record<string, unknown> = {};
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue(result) });
    chain.limit = jest.fn().mockResolvedValue(result);
    chain.maybeSingle = jest.fn().mockResolvedValue(result);
    // When the chain is awaited directly (no .maybeSingle or .limit), return result
    chain[Symbol.toStringTag] = "Promise";
    chain.then = (resolve: (v: unknown) => void) => resolve(result);
    chain.catch = jest.fn();
    return chain;
  };

  const makeSelectChain = (data: unknown, error: unknown = null) => {
    const chain = resolvedChain(data, error);
    return {
      eq: jest.fn().mockReturnValue(chain),
    };
  };

  // Call 1: checkOrgAccess specific membership check OR primary org lookup
  const call1Data =
    opts.membershipRow ?? (opts.primaryMembership ? [opts.primaryMembership] : null);
  // Call 2: checkOrgAccess all memberships (admin fallback)
  const call2Data = opts.allMemberships ?? [];
  // Call 3: not used in current test patterns

  let callCount = 0;
  mock.from.mockImplementation(() => {
    callCount++;
    if (callCount === 1)
      return { select: jest.fn().mockReturnValue(makeSelectChain(call1Data, opts.error)) };
    return { select: jest.fn().mockReturnValue(makeSelectChain(call2Data)) };
  });

  (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);
  return mock;
}

describe("requireOrgAccess middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("with organization_id in query", () => {
    it("calls next() when user has direct membership", async () => {
      mockSupabase({
        membershipRow: { id: "m1", roles: { id: "r1", key: "client_user" } },
      });
      const next = jest.fn();

      await requireOrgAccess(
        mockReq({ userId: "user-1", orgId: "00000000-0000-0000-0000-000000000001" }),
        mockRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith();
    });

    it("calls next() when user is admin (fallback check)", async () => {
      mockSupabase({
        membershipRow: null,
        allMemberships: [{ id: "m1", roles: { id: "r1", key: "admin" } }],
      });
      const next = jest.fn();

      await requireOrgAccess(
        mockReq({ userId: "user-1", orgId: "00000000-0000-0000-0000-000000000001" }),
        mockRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith();
    });

    it("calls next() when user is super_admin (fallback check)", async () => {
      mockSupabase({
        membershipRow: null,
        allMemberships: [{ id: "m1", roles: { id: "r1", key: "super_admin" } }],
      });
      const next = jest.fn();

      await requireOrgAccess(
        mockReq({ userId: "user-1", orgId: "00000000-0000-0000-0000-000000000001" }),
        mockRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith();
    });

    it("returns 403 when user has no membership and is not admin", async () => {
      mockSupabase({
        membershipRow: null,
        allMemberships: [{ id: "m1", roles: { id: "r1", key: "client_user" } }],
      });
      const next = jest.fn();

      await requireOrgAccess(
        mockReq({ userId: "user-1", orgId: "00000000-0000-0000-0000-000000000001" }),
        mockRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
    });

    it("returns 403 when user has no memberships at all", async () => {
      mockSupabase({
        membershipRow: null,
        allMemberships: [],
      });
      const next = jest.fn();

      await requireOrgAccess(
        mockReq({ userId: "user-1", orgId: "00000000-0000-0000-0000-000000000001" }),
        mockRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
    });
  });

  describe("with organizationId in body", () => {
    it("calls next() when user has direct membership", async () => {
      mockSupabase({
        membershipRow: { id: "m1", roles: { id: "r1", key: "client_user" } },
      });
      const next = jest.fn();

      await requireOrgAccess(
        mockReq({ userId: "user-1", bodyOrgId: "00000000-0000-0000-0000-000000000001" }),
        mockRes(),
        next,
      );

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("without org ID (auto-assign primary)", () => {
    it("calls next() when user has a primary org", async () => {
      mockSupabase({
        primaryMembership: { organization_id: "00000000-0000-0000-0000-000000000001" },
      });
      const next = jest.fn();
      const req = mockReq({ userId: "user-1" });

      await requireOrgAccess(req, mockRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect((req as any).orgAccessInjected).toBe(true);
      expect((req as any).orgAccessPlatformAdmin).toBe(false);
      expect(req.query.organization_id).toBe("00000000-0000-0000-0000-000000000001");
    });

    it("does NOT inject a default org for platform admins (sees all tenants)", async () => {
      mockSupabase({
        primaryMembership: {
          organization_id: "00000000-0000-0000-0000-000000000001",
          roles: { key: "super_admin" },
        },
      });
      const next = jest.fn();
      const req = mockReq({ userId: "user-1" });

      await requireOrgAccess(req, mockRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query.organization_id).toBeUndefined();
      expect((req as any).orgAccessInjected).toBeUndefined();
      expect((req as any).orgAccessPlatformAdmin).toBe(true);
    });

    it("treats an admin-role membership as platform admin when no org is given", async () => {
      mockSupabase({
        primaryMembership: {
          organization_id: "00000000-0000-0000-0000-000000000001",
          roles: { key: "admin" },
        },
      });
      const next = jest.fn();
      const req = mockReq({ userId: "user-1" });

      await requireOrgAccess(req, mockRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query.organization_id).toBeUndefined();
      expect((req as any).orgAccessPlatformAdmin).toBe(true);
    });

    it("returns 403 when user has no approved memberships", async () => {
      mockSupabase({});
      const next = jest.fn();

      await requireOrgAccess(mockReq({ userId: "user-1" }), mockRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
    });

    it("prefers the X-Active-Org header when the user is a member there", async () => {
      mockSupabase({
        primaryMembership: { organization_id: "00000000-0000-0000-0000-000000000002" },
      });
      const next = jest.fn();
      const req = mockReq({ userId: "user-1" });
      req.headers = { "x-active-org": "00000000-0000-0000-0000-000000000002" };

      await requireOrgAccess(req, mockRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect((req.query as Record<string, string>).organization_id).toBe(
        "00000000-0000-0000-0000-000000000002",
      );
    });

    it("falls back to the primary org when the active org header is not a membership", async () => {
      mockSupabase({
        membershipRow: null,
        allMemberships: [{ organization_id: "00000000-0000-0000-0000-000000000001" }],
      });
      const next = jest.fn();
      const req = mockReq({ userId: "user-1" });
      req.headers = { "x-active-org": "00000000-0000-0000-0000-000000000099" };

      await requireOrgAccess(req, mockRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect((req.query as Record<string, string>).organization_id).toBe(
        "00000000-0000-0000-0000-000000000001",
      );
    });

    it("prefers the mct_active_org cookie when no header is present", async () => {
      mockSupabase({
        primaryMembership: { organization_id: "00000000-0000-0000-0000-000000000003" },
      });
      const next = jest.fn();
      const req = mockReq({ userId: "user-1" });
      req.cookies = { mct_active_org: "00000000-0000-0000-0000-000000000003" };

      await requireOrgAccess(req, mockRes(), next);

      expect(next).toHaveBeenCalledWith();
      expect((req.query as Record<string, string>).organization_id).toBe(
        "00000000-0000-0000-0000-000000000003",
      );
    });
  });

  describe("without authUser", () => {
    it("returns 401 when no authUser", async () => {
      const next = jest.fn();

      await requireOrgAccess(mockReq({}), mockRes(), next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    });
  });
});

describe("requireOrgAccessByParam middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls next() when user has direct membership", async () => {
    mockSupabase({
      membershipRow: { id: "m1", roles: { id: "r1", key: "client_user" } },
    });
    const next = jest.fn();

    await requireOrgAccessByParam(
      mockReq({ userId: "user-1", paramsId: "00000000-0000-0000-0000-000000000001" }),
      mockRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it("calls next() when user is admin (fallback)", async () => {
    mockSupabase({
      membershipRow: null,
      allMemberships: [{ id: "m1", roles: { id: "r1", key: "admin" } }],
    });
    const next = jest.fn();

    await requireOrgAccessByParam(
      mockReq({ userId: "user-1", paramsId: "00000000-0000-0000-0000-000000000001" }),
      mockRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it("returns 403 when user has no access", async () => {
    mockSupabase({
      membershipRow: null,
      allMemberships: [{ id: "m1", roles: { id: "r1", key: "client_user" } }],
    });
    const next = jest.fn();

    await requireOrgAccessByParam(
      mockReq({ userId: "user-1", paramsId: "00000000-0000-0000-0000-000000000001" }),
      mockRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("returns 401 when no authUser", async () => {
    const next = jest.fn();

    await requireOrgAccessByParam(
      mockReq({ paramsId: "00000000-0000-0000-0000-000000000001" }),
      mockRes(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });
});
