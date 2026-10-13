import { jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";

const envState: { MFA_ENFORCEMENT_ENABLED?: string } = {};

jest.mock("../config/env", () => ({
  getEnv: jest.fn(() => ({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
    MFA_ENFORCEMENT_ENABLED: envState.MFA_ENFORCEMENT_ENABLED,
  })),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { getSupabaseAdmin } from "../services/supabase";
import { requireAuth } from "../middleware/auth";
import {
  clearMfaFactorCache,
  decodeAssuranceLevel,
  isMfaExemptPath,
  requiresSecondFactor,
  userHasPrivilegedRole,
  userHasVerifiedFactor,
} from "../lib/mfa";
import { createMockBuilder } from "./helpers";

function unsignedJwt(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

function mockAdmin({
  factors,
  error = null,
  isSuperAdmin = false,
  roleKeys = [] as string[],
}: {
  factors?: unknown[];
  error?: unknown;
  isSuperAdmin?: boolean;
  roleKeys?: string[];
} = {}) {
  const listFactors = jest.fn().mockResolvedValue({
    data: error ? null : { factors: factors ?? [] },
    error,
  });
  const from = jest.fn((table: string) => {
    if (table === "profiles") {
      return createMockBuilder({ data: { is_super_admin: isSuperAdmin }, error: null });
    }
    if (table === "memberships") {
      return createMockBuilder({
        data: roleKeys.map((key) => ({ roles: { key } })),
        error: null,
      });
    }
    return createMockBuilder({ data: null, error: null });
  });
  (getSupabaseAdmin as jest.Mock).mockReturnValue({
    from,
    auth: { getUser: jest.fn(), admin: { mfa: { listFactors } } },
  });
  return listFactors;
}

describe("decodeAssuranceLevel", () => {
  it("reads aal1 and aal2", () => {
    expect(decodeAssuranceLevel(unsignedJwt({ sub: "u", aal: "aal1" }))).toBe("aal1");
    expect(decodeAssuranceLevel(unsignedJwt({ sub: "u", aal: "aal2" }))).toBe("aal2");
  });

  it("returns null for missing or malformed claims", () => {
    expect(decodeAssuranceLevel(unsignedJwt({ sub: "u" }))).toBeNull();
    expect(decodeAssuranceLevel("not-a-jwt")).toBeNull();
    expect(decodeAssuranceLevel("a.b")).toBeNull();
  });
});

describe("isMfaExemptPath", () => {
  it("exempts the auth surface so a challenge can be completed", () => {
    expect(isMfaExemptPath("/api/v1/auth/mfa/challenge")).toBe(true);
    expect(isMfaExemptPath("/api/v1/auth/me")).toBe(true);
    expect(isMfaExemptPath("/api/v1/tickets")).toBe(false);
  });
});

describe("userHasVerifiedFactor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMfaFactorCache();
  });

  it("detects a verified totp factor", async () => {
    mockAdmin({
      factors: [
        { id: "f-1", status: "unverified", factor_type: "totp" },
        { id: "f-2", status: "verified", factor_type: "totp" },
      ],
    });

    await expect(userHasVerifiedFactor("user-1")).resolves.toBe(true);
  });

  it("returns false when no factor is verified", async () => {
    mockAdmin({ factors: [{ id: "f-1", status: "unverified", factor_type: "totp" }] });

    await expect(userHasVerifiedFactor("user-1")).resolves.toBe(false);
  });

  it("caches the lookup", async () => {
    const listFactors = mockAdmin({ factors: [{ status: "verified", factor_type: "totp" }] });

    await userHasVerifiedFactor("user-1");
    await userHasVerifiedFactor("user-1");

    expect(listFactors).toHaveBeenCalledTimes(1);
  });

  it("returns null when the lookup fails", async () => {
    mockAdmin({ error: { message: "boom" } });

    await expect(userHasVerifiedFactor("user-1")).resolves.toBeNull();
  });
});

describe("userHasPrivilegedRole [SEC-P2-005]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMfaFactorCache();
  });

  it("detects an approved admin membership", async () => {
    mockAdmin({ roleKeys: ["admin"] });
    await expect(userHasPrivilegedRole("user-1")).resolves.toBe(true);
  });

  it("detects the is_super_admin profile flag", async () => {
    mockAdmin({ isSuperAdmin: true });
    await expect(userHasPrivilegedRole("user-1")).resolves.toBe(true);
  });

  it("returns false for a regular member", async () => {
    mockAdmin({ roleKeys: ["client_user"] });
    await expect(userHasPrivilegedRole("user-1")).resolves.toBe(false);
  });

  it("caches the lookup", async () => {
    mockAdmin({ roleKeys: ["admin"] });
    const from = (getSupabaseAdmin as jest.Mock)().from as jest.Mock;

    await userHasPrivilegedRole("user-1");
    await userHasPrivilegedRole("user-1");

    expect(from).toHaveBeenCalledTimes(2); // profiles + memberships, once
  });

  it("falls back to not-privileged when the lookup errors", async () => {
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn(() => {
        throw new Error("db down");
      }),
      auth: { getUser: jest.fn(), admin: { mfa: { listFactors: jest.fn() } } },
    });

    await expect(userHasPrivilegedRole("user-1")).resolves.toBe(false);
  });
});

describe("requiresSecondFactor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMfaFactorCache();
    envState.MFA_ENFORCEMENT_ENABLED = "true";
  });

  it("does not block a regular user when the opt-in flag is off", async () => {
    envState.MFA_ENFORCEMENT_ENABLED = "false";
    mockAdmin({ factors: [{ status: "verified", factor_type: "totp" }] });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal1" }), "user-1", "/api/v1/tickets"),
    ).resolves.toBe(false);
  });

  it("enforces a privileged session even when the flag is unset", async () => {
    envState.MFA_ENFORCEMENT_ENABLED = undefined;
    mockAdmin({ factors: [{ status: "verified", factor_type: "totp" }], roleKeys: ["admin"] });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal1" }), "user-1", "/api/v1/tickets"),
    ).resolves.toBe(true);
  });

  it("enforces an admin membership even when the opt-in flag is off", async () => {
    envState.MFA_ENFORCEMENT_ENABLED = "false";
    mockAdmin({ factors: [{ status: "verified", factor_type: "totp" }], roleKeys: ["admin"] });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal1" }), "user-1", "/api/v1/tickets"),
    ).resolves.toBe(true);
  });

  it("enforces the is_super_admin profile flag even when the opt-in flag is off", async () => {
    envState.MFA_ENFORCEMENT_ENABLED = "false";
    mockAdmin({ factors: [{ status: "verified", factor_type: "totp" }], isSuperAdmin: true });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal1" }), "user-1", "/api/v1/tickets"),
    ).resolves.toBe(true);
  });

  it("does not block a privileged user with no enrolled factor", async () => {
    envState.MFA_ENFORCEMENT_ENABLED = "false";
    mockAdmin({ factors: [], roleKeys: ["super_admin"] });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal1" }), "user-1", "/api/v1/tickets"),
    ).resolves.toBe(false);
  });

  it("does not block a regular member when the flag is off", async () => {
    envState.MFA_ENFORCEMENT_ENABLED = "false";
    mockAdmin({ factors: [{ status: "verified", factor_type: "totp" }], roleKeys: ["client_user"] });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal1" }), "user-1", "/api/v1/tickets"),
    ).resolves.toBe(false);
  });

  it("does nothing on the auth surface", async () => {
    mockAdmin({ factors: [{ status: "verified", factor_type: "totp" }] });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal1" }), "user-1", "/api/v1/auth/mfa/verify"),
    ).resolves.toBe(false);
  });

  it("does nothing for an aal2 session", async () => {
    const listFactors = mockAdmin({ factors: [{ status: "verified", factor_type: "totp" }] });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal2" }), "user-1", "/api/v1/tickets"),
    ).resolves.toBe(false);
    expect(listFactors).not.toHaveBeenCalled();
  });

  it("requires a second factor for an aal1 session with a verified factor", async () => {
    mockAdmin({ factors: [{ status: "verified", factor_type: "totp" }] });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal1" }), "user-1", "/api/v1/tickets"),
    ).resolves.toBe(true);
  });

  it("does not block a user with no enrolled factor (cannot lock anyone out)", async () => {
    mockAdmin({ factors: [] });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal1" }), "user-1", "/api/v1/tickets"),
    ).resolves.toBe(false);
  });

  it("fails open when the factor lookup errors", async () => {
    mockAdmin({ error: { message: "goTrue down" } });

    await expect(
      requiresSecondFactor(unsignedJwt({ aal: "aal1" }), "user-1", "/api/v1/tickets"),
    ).resolves.toBe(false);
  });
});

describe("requireAuth MFA enforcement", () => {
  function req(url: string): Request {
    return {
      headers: { authorization: "Bearer opaque-token" } as Record<string, string>,
      originalUrl: url,
    } as unknown as Request;
  }

  function res(): Response {
    const out: Partial<Response> = {};
    out.status = jest.fn().mockReturnValue(out);
    out.json = jest.fn().mockReturnValue(out);
    return out as Response;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    clearMfaFactorCache();
    envState.MFA_ENFORCEMENT_ENABLED = "true";
  });

  it("rejects an aal1 session with a verified factor on a data route", async () => {
    const listFactors = jest.fn().mockResolvedValue({
      data: { factors: [{ status: "verified", factor_type: "totp" }] },
      error: null,
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "test@example.com" } },
          error: null,
        }),
        admin: { mfa: { listFactors } },
      },
    });

    const next = jest.fn() as NextFunction;
    await requireAuth(req("/api/v1/tickets"), res(), next);

    const error = (next as jest.Mock).mock.calls[0][0] as { code?: string; status?: number };
    expect(error.code).toBe("MFA_REQUIRED");
    expect(error.status).toBe(403);
  });

  it("allows the same session through once the path is exempt", async () => {
    mockAdmin({ factors: [{ status: "verified", factor_type: "totp" }] });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "test@example.com" } },
          error: null,
        }),
        admin: { mfa: { listFactors: jest.fn() } },
      },
    });

    const next = jest.fn() as NextFunction;
    await requireAuth(req("/api/v1/auth/me"), res(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("allows a user with no factor through", async () => {
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "test@example.com" } },
          error: null,
        }),
        admin: {
          mfa: { listFactors: jest.fn().mockResolvedValue({ data: { factors: [] }, error: null }) },
        },
      },
    });

    const next = jest.fn() as NextFunction;
    await requireAuth(req("/api/v1/tickets"), res(), next);

    expect(next).toHaveBeenCalledWith();
  });
});
