import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";

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

describe("requireAuth middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets authUser for a valid token", async () => {
    const mock = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "test@example.com" } },
          error: null,
        }),
      },
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);

    const req = mockReq({ authorization: "Bearer valid-token" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(req.authUser).toBeDefined();
    expect(req.authUser!.userId).toBe("user-1");
    expect(req.authUser!.email).toBe("test@example.com");
    expect(next).toHaveBeenCalled();
  });

  it("calls next with error when no authorization header", async () => {
    mockAuthUser();

    const req = mockReq({}) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("calls next with error when header is not Bearer", async () => {
    const req = mockReq({ authorization: "Basic dXNlcjpwYXNz" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("calls next with error when token is invalid", async () => {
    const mock = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("Invalid token"),
        }),
      },
    };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);

    const req = mockReq({ authorization: "Bearer bad-token" }) as Request;
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  function mockAuthUser() {
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "test@example.com" } },
          error: null,
        }),
      },
    });
  }
});
