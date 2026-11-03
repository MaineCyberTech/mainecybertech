import { jest } from "@jest/globals";
import type { Request } from "express";

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { resolveAdminTenantScope } from "../lib/admin-scope";
import { createMockBuilder } from "./helpers";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";

function makeReq(overrides: Record<string, unknown> = {}): Request {
  return {
    authUser: { userId: "user-1", email: "admin@example.com" },
    ...overrides,
  } as unknown as Request;
}

function mockScope(memberships: unknown[], profile: unknown) {
  const supabase = {
    from: jest.fn((table: string) => {
      if (table === "memberships") {
        return createMockBuilder({ data: memberships, error: null });
      }
      if (table === "profiles") {
        return createMockBuilder({ data: profile, error: null });
      }
      return createMockBuilder({ data: null, error: null });
    }),
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

describe("resolveAdminTenantScope cross-org admin containment (MT-P1-005)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not add a client-only membership to a tenant admin's scope", async () => {
    mockScope(
      [
        { organization_id: ORG_A, roles: { key: "admin" } },
        { organization_id: ORG_B, roles: { key: "client_user" } },
      ],
      { is_super_admin: false },
    );

    const scope = await resolveAdminTenantScope(makeReq());

    expect(scope).toEqual({ allTenants: false, orgIds: [ORG_A] });
    expect(scope.orgIds).not.toContain(ORG_B);
  });

  it("keeps all-tenant reach only for a genuine platform admin", async () => {
    mockScope(
      [
        { organization_id: ORG_A, roles: { key: "super_admin" } },
        { organization_id: ORG_B, roles: { key: "client_user" } },
      ],
      { is_super_admin: true },
    );

    const scope = await resolveAdminTenantScope(makeReq());

    expect(scope.allTenants).toBe(true);
  });

  it("does not treat a super_admin role without the profile flag as cross-tenant", async () => {
    mockScope([{ organization_id: ORG_A, roles: { key: "super_admin" } }], {
      is_super_admin: false,
    });

    const scope = await resolveAdminTenantScope(makeReq());

    expect(scope).toEqual({ allTenants: false, orgIds: [ORG_A] });
  });

  it("uses the explicitly selected client org without widening to the admin org", async () => {
    mockScope(
      [
        { organization_id: ORG_A, roles: { key: "admin" } },
        { organization_id: ORG_B, roles: { key: "client_user" } },
      ],
      { is_super_admin: false },
    );

    const req = makeReq({
      orgId: ORG_B,
      orgScope: {
        orgId: ORG_B,
        explicit: true,
        platformAdmin: false,
        impersonation: false,
      },
    });

    const scope = await resolveAdminTenantScope(req);

    expect(scope).toEqual({ allTenants: false, orgIds: [ORG_B] });
  });

  it("keeps all approved orgs for non-admin callers (exports keep working)", async () => {
    mockScope(
      [
        { organization_id: ORG_A, roles: { key: "technician" } },
        { organization_id: ORG_B, roles: { key: "client_user" } },
      ],
      { is_super_admin: false },
    );

    const scope = await resolveAdminTenantScope(makeReq());

    expect(scope).toEqual({ allTenants: false, orgIds: [ORG_A, ORG_B] });
  });
});
