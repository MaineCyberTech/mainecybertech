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
  
}));

import { getSupabaseAdmin } from "../services/supabase";

function mockReq(userId?: string) {
  return { authUser: userId ? { userId, email: "test@example.com" } : undefined } as unknown as Request;
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
    mockSupabase([{ roles: { id: "role-1", key: "admin" } }]);
    const next = jest.fn();

    await requireAdmin(mockReq("user-1"), mockRes(), next as NextFunction);

    expect(next).toHaveBeenCalled();
  });

  it("calls next() for user with super_admin role", async () => {
    mockSupabase([{ roles: { id: "role-1", key: "super_admin" } }]);
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
    mockSupabase([{ roles: { id: "role-1", key: "client_user" } }]);
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
});
