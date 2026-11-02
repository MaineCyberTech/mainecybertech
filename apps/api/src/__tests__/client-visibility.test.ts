import { jest } from "@jest/globals";
import type { Request } from "express";

const membershipBuilder = {
  select: jest.fn(),
  eq: jest.fn(),
  maybeSingle: jest.fn(),
};

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(() => ({ from: jest.fn(() => membershipBuilder) })),
}));

jest.mock("../lib/logger", () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

import { applyClientVisibility, isClientMember, isClientVisible } from "../lib/client-visibility";

function request(roleKey?: string, orgId = "org-1"): Request {
  return {
    authUser: { userId: "user-1", email: "user@example.com" },
    orgId,
    orgScope: { orgId, explicit: true, platformAdmin: false, impersonation: false },
    query: { organization_id: orgId },
    headers: {},
  } as unknown as Request;
}

function mockRole(roleKey: string | null) {
  membershipBuilder.select.mockReturnValue(membershipBuilder);
  membershipBuilder.eq.mockReturnValue(membershipBuilder);
  membershipBuilder.maybeSingle.mockResolvedValue({
    data: roleKey ? { roles: { key: roleKey } } : null,
    error: null,
  });
}

describe("client visibility scoping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("recognises client roles", async () => {
    mockRole("client_admin");
    await expect(isClientMember(request())).resolves.toBe(true);
  });

  it("treats MSP staff as non-client", async () => {
    mockRole("engineer");
    await expect(isClientMember(request())).resolves.toBe(false);
  });

  it("caches the role lookup per request", async () => {
    mockRole("client_user");
    const req = request();
    await isClientMember(req);
    await isClientMember(req);
    expect(membershipBuilder.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("adds the visibility predicate for clients", async () => {
    mockRole("client_user");
    const query = { in: jest.fn().mockReturnThis() };
    const result = await applyClientVisibility(query, request());
    expect(query.in).toHaveBeenCalledWith("visibility", expect.arrayContaining(["client_visible"]));
    expect(result.query).toBe(query);
  });

  it("does not filter for staff", async () => {
    mockRole("technician");
    const query = { in: jest.fn().mockReturnThis() };
    await applyClientVisibility(query, request());
    expect(query.in).not.toHaveBeenCalled();
  });

  it("accepts legacy client-visible values and rejects internal", async () => {
    mockRole("client_admin");
    await expect(isClientVisible(request(), { visibility: "org" })).resolves.toBe(true);
    await expect(isClientVisible(request(), { visibility: "client" })).resolves.toBe(true);
    await expect(isClientVisible(request(), { visibility: "internal" })).resolves.toBe(false);
  });
});
