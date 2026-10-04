import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth";
import { hashApiKey, isApiKeyToken } from "../middleware/api-key";

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
import { createMockBuilder } from "./helpers";

const ORG_ID = "00000000-0000-0000-0000-000000000001";
const CREATED_BY = "user-1";
const TOKEN = `mct_${"a".repeat(64)}`;

function mockReq(headers?: Record<string, string>): Partial<Request> {
  return {
    headers: (headers ?? {}) as Record<string, string>,
    query: {},
  };
}

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockKeyRow(overrides: Record<string, unknown> = {}) {
  const row = {
    id: "key-1",
    organization_id: ORG_ID,
    key_hash: hashApiKey(TOKEN),
    key_prefix: TOKEN.slice(0, 12),
    permissions: [],
    expires_at: null as string | null,
    is_active: true,
    created_by: CREATED_BY,
    ...overrides,
  };
  const builder = createMockBuilder({ data: row, error: null });
  (getSupabaseAdmin as jest.Mock).mockReturnValue({ from: jest.fn(() => builder) });
  return builder;
}

describe("requireAuth — API key path (FEAT-P2-001)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("recognises mct_ tokens as API keys", () => {
    expect(isApiKeyToken(TOKEN)).toBe(true);
    expect(isApiKeyToken("eyJhbGciOiJIUzI1NiJ9.jwt")).toBe(false);
  });

  it("authenticates a valid key and pins the request to the key's org", async () => {
    mockKeyRow();
    const req = mockReq({ authorization: `Bearer ${TOKEN}` }) as Request;
    req.query = { organization_id: "00000000-0000-0000-0000-000000000099" };
    const res = mockRes() as Response;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.authUser).toEqual({ userId: CREATED_BY, email: "api-key" });
    expect(req.apiKey).toEqual({
      id: "key-1",
      organizationId: ORG_ID,
      permissions: [],
      prefix: TOKEN.slice(0, 12),
    });
    // Caller-supplied org is overwritten so a key cannot be repointed.
    expect(req.query).toEqual({ organization_id: ORG_ID });
    expect(req.orgScope?.orgId).toBe(ORG_ID);
    expect(req.orgId).toBe(ORG_ID);
    // API keys must not be treated as user JWTs (would send an invalid JWT to RLS).
    expect(req.userJwt).toBeUndefined();
  });

  it("401s a revoked key", async () => {
    mockKeyRow({ is_active: false });
    const req = mockReq({ authorization: `Bearer ${TOKEN}` }) as Request;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, mockRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    expect(req.authUser).toBeUndefined();
  });

  it("401s an expired key", async () => {
    mockKeyRow({ expires_at: new Date(Date.now() - 60_000).toISOString() });
    const req = mockReq({ authorization: `Bearer ${TOKEN}` }) as Request;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, mockRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("401s when the hash does not match the stored key", async () => {
    mockKeyRow({ key_hash: hashApiKey("mct_" + "b".repeat(64)) });
    const req = mockReq({ authorization: `Bearer ${TOKEN}` }) as Request;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, mockRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("401s an unknown key prefix", async () => {
    const builder = createMockBuilder({ data: null, error: null });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from: jest.fn(() => builder) });
    const req = mockReq({ authorization: `Bearer ${TOKEN}` }) as Request;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, mockRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("does not fall back to the session cookie for mct_ tokens", async () => {
    mockKeyRow({ is_active: false });
    const req = mockReq({ authorization: `Bearer ${TOKEN}` }) as Request;
    req.cookies = { mct_session: "valid-session" } as never;
    const next = jest.fn() as NextFunction;

    await requireAuth(req, mockRes() as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });
});
