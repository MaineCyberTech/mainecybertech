import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { requireAdmin } from "../middleware/admin";

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
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));

import { getSupabaseAdmin } from "../services/supabase";

function mockReq(
  userId?: string,
  opts: { orgId?: string; explicit?: boolean; platformAdmin?: boolean } = {},
) {
  const req = {
    authUser: userId ? { userId, email: "test@example.com" } : undefined,
  } as unknown as Request;
  if (opts.orgId !== undefined) {
    req.orgId = opts.orgId;
    req.orgScope = {
      orgId: opts.orgId,
      explicit: opts.explicit ?? true,
      platformAdmin: opts.platformAdmin ?? false,
      impersonation: false,
    };
  }
  return req;
}

function mockRes() {
  return { status: jest.fn(), json: jest.fn() } as unknown as Response;
}

function mockSupabase(joinResults: any[] = [], error: any = null) {
  const mock = {
    from: jest.fn(),
  };

  mock.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: joinResults, error }),
      }),
    }),
  });

  (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);
  return mock;
}

describe("requireAdmin middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls next() for user with admin role", async () => {
    mockSupabase([{ roles: { id: "00000000-0000-0000-0000-000000000020", key: "admin" } }]);
    const next = jest.fn();

    await requireAdmin(mockReq("user-1"), mockRes(), next as NextFunction);

    expect(next).toHaveBeenCalled();
  });

  it("calls next() for user with super_admin role", async () => {
    mockSupabase([{ roles: { id: "00000000-0000-0000-0000-000000000020", key: "super_admin" } }]);
    const next = jest.fn();

    await requireAdmin(mockReq("user-1"), mockRes(), next as NextFunction);

    expect(next).toHaveBeenCalled();
  });

  it("returns 401 when no authUser", async () => {
    const next = jest.fn();

    await requireAdmin(mockReq(undefined), mockRes(), next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("returns 403 when no approved memberships", async () => {
    mockSupabase([]);
    const next = jest.fn();

    await requireAdmin(mockReq("user-1"), mockRes(), next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("returns 403 when no admin role", async () => {
    mockSupabase([{ roles: { id: "00000000-0000-0000-0000-000000000020", key: "client_user" } }]);
    const next = jest.fn();

    await requireAdmin(mockReq("user-1"), mockRes(), next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("returns 403 when query fails", async () => {
    mockSupabase([], { message: "DB error" });
    const next = jest.fn();

    await requireAdmin(mockReq("user-1"), mockRes(), next as NextFunction);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  describe("org-scoped semantics (ADMIN-P1-001 / MT-P1-001)", () => {
    const ORG_A = "00000000-0000-0000-0000-00000000000a";
    const ORG_B = "00000000-0000-0000-0000-00000000000b";

    it("regression: an org-A admin cannot act when the request is pinned to org B", async () => {
      mockSupabase([
        {
          organization_id: ORG_A,
          roles: { id: "role-admin", key: "admin" },
        },
      ]);
      const next = jest.fn();

      await requireAdmin(
        mockReq("user-1", { orgId: ORG_B, explicit: true }),
        mockRes(),
        next as NextFunction,
      );

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
    });

    it("allows an org-A admin on a request pinned to org A", async () => {
      mockSupabase([
        {
          organization_id: ORG_A,
          roles: { id: "role-admin", key: "admin" },
        },
      ]);
      const next = jest.fn();

      await requireAdmin(
        mockReq("user-1", { orgId: ORG_A, explicit: true }),
        mockRes(),
        next as NextFunction,
      );

      expect(next).toHaveBeenCalledWith();
    });

    it("allows a super_admin to act cross-tenant on a pinned org", async () => {
      mockSupabase([
        {
          organization_id: ORG_A,
          roles: { id: "role-super", key: "super_admin" },
        },
      ]);
      const next = jest.fn();

      await requireAdmin(
        mockReq("user-1", { orgId: ORG_B, explicit: true }),
        mockRes(),
        next as NextFunction,
      );

      expect(next).toHaveBeenCalledWith();
    });

    it("does not apply the org pin when no explicit scope was resolved", async () => {
      mockSupabase([
        {
          organization_id: ORG_A,
          roles: { id: "role-admin", key: "admin" },
        },
      ]);
      const next = jest.fn();

      await requireAdmin(mockReq("user-1"), mockRes(), next as NextFunction);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
