import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin } from "../services/supabase";
import { clearMfaFactorCache } from "../lib/mfa";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
    JWT_SECRET: "test-jwt-secret",
  }),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()),
}));

function mockReq(headers?: Record<string, string>): Partial<Request> {
  return {
    headers: (headers ?? {}) as Record<string, string>,
  };
}

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("requireAuth — local JWT verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMfaFactorCache();
  });

  it("maps an expired token to HTTP 401 (not the invalid status 40101)", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      sub: "user-1",
      email: "test@example.com",
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    const req = mockReq({ authorization: "Bearer expired-token" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    const err = (next as jest.Mock).mock.calls[0][0] as Error;
    expect(err.message).toMatch(/expired/i);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("accepts a valid unexpired token without a Supabase getUser round-trip", async () => {
    (jwt.verify as jest.Mock).mockReturnValue({
      sub: "user-1",
      email: "test@example.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    // SEC-P2-005: requireAuth consults the cached GoTrue factor list (admin
    // API) to decide whether a privileged session needs aal2; it must NOT
    // re-verify the local JWT via `auth.getUser`.
    const supabase = {
      auth: {
        getUser: jest.fn(),
        admin: {
          mfa: {
            listFactors: jest.fn().mockResolvedValue({ data: { factors: [] }, error: null }),
          },
        },
      },
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const req = mockReq({ authorization: "Bearer valid-token" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(req.authUser).toEqual({ userId: "user-1", email: "test@example.com" });
    expect(next).toHaveBeenCalledWith();
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  it("does not hang when the Supabase getUser fallback times out", async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const supabase = {
      auth: {
        getUser: jest.fn().mockRejectedValue(new DOMException("The operation was aborted", "TimeoutError")),
      },
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);

    const req = mockReq({ authorization: "Bearer any-token" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });
});
