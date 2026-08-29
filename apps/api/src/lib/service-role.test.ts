import type { Request } from "express";
import { withServiceRole } from "./service-role";
import { logImpersonation } from "../services/impersonation";
import { getSupabaseAdmin } from "../services/supabase";

jest.mock("../services/impersonation", () => ({
  logImpersonation: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../lib/logger", () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(() => ({ __admin: true })),
}));

const mockedLogImpersonation = logImpersonation as jest.Mock;
const mockedGetSupabaseAdmin = getSupabaseAdmin as jest.Mock;

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    authUser: { userId: "user-123", email: "u@example.com" },
    orgScope: { orgId: "org-456", explicit: true, platformAdmin: false, impersonation: false },
    ...overrides,
  } as unknown as Request;
}

describe("withServiceRole", () => {
  beforeEach(() => {
    mockedLogImpersonation.mockClear();
    mockedGetSupabaseAdmin.mockClear();
  });

  it("invokes fn with the service-role admin client and returns its result", async () => {
    const req = makeReq();
    const fn = jest.fn().mockResolvedValue("ok");

    const result = await withServiceRole("backfill profile pii", req, fn);

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(mockedGetSupabaseAdmin).toHaveBeenCalled();
    expect(fn.mock.calls[0][0]).toEqual({ __admin: true });
  });

  it("logs an impersonation/escalation audit entry with actor, org, and reason", async () => {
    const req = makeReq();
    await withServiceRole("tenant-data export", req, jest.fn().mockResolvedValue(undefined));

    expect(mockedLogImpersonation).toHaveBeenCalledTimes(1);
    const input = mockedLogImpersonation.mock.calls[0][0];
    expect(input.actorUserId).toBe("user-123");
    expect(input.organizationId).toBe("org-456");
    expect(input.reason).toBe("tenant-data export");
    expect(input.actorRoleKey).toBe("service_role");
    expect(input.source).toBe("service_role.escalation");
    expect(input.metadata.timestamp).toEqual(expect.any(String));
  });

  it("falls back to null orgId and 'unknown' actor when request context is absent", async () => {
    const req = makeReq({ authUser: undefined, orgScope: undefined });
    await withServiceRole("system escalation", req, jest.fn().mockResolvedValue(undefined));

    const input = mockedLogImpersonation.mock.calls[0][0];
    expect(input.actorUserId).toBe("unknown");
    expect(input.organizationId).toBeNull();
  });

  it("rethrows when the wrapped fn fails", async () => {
    const req = makeReq();
    const boom = new Error("db exploded");
    const fn = jest.fn().mockRejectedValue(boom);

    await expect(withServiceRole("risky op", req, fn)).rejects.toThrow("db exploded");
    expect(mockedGetSupabaseAdmin).toHaveBeenCalled();
  });
});
