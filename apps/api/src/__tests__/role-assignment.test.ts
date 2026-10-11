import { jest } from "@jest/globals";
import {
  assertCanAssignRole,
  isCrossTenantRoleKey,
  resolveRoleKey,
} from "../lib/role-assignment";

type Row = { data: unknown; error: unknown };

function makeClient(responses: Record<string, Row>) {
  return {
    from: jest.fn((table: string) => {
      const chain = {
        select: jest.fn(() => chain),
        eq: jest.fn(() => chain),
        maybeSingle: jest.fn(async () => responses[table] ?? { data: null, error: null }),
      };
      return chain;
    }),
  } as never;
}

describe("role-assignment guard [SEC-P1-001 / ADMIN-P1-003 / CHAIN-P1-004]", () => {
  it("classifies cross-tenant role keys", () => {
    expect(isCrossTenantRoleKey("admin")).toBe(true);
    expect(isCrossTenantRoleKey("super_admin")).toBe(true);
    expect(isCrossTenantRoleKey("member")).toBe(false);
    expect(isCrossTenantRoleKey(undefined)).toBe(false);
  });

  it("rejects a non-super-admin assigning a cross-tenant role", async () => {
    const supabase = makeClient({ profiles: { data: { is_super_admin: false }, error: null } });
    await expect(
      assertCanAssignRole(supabase, "caller-1", "admin", "target-1"),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rejects a non-super-admin changing their own role", async () => {
    const supabase = makeClient({ profiles: { data: { is_super_admin: false }, error: null } });
    await expect(
      assertCanAssignRole(supabase, "caller-1", "member", "caller-1"),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("allows a super admin to assign a cross-tenant role", async () => {
    const supabase = makeClient({ profiles: { data: { is_super_admin: true }, error: null } });
    await expect(
      assertCanAssignRole(supabase, "caller-1", "super_admin", "target-1"),
    ).resolves.toBeUndefined();
  });

  it("allows a non-super-admin to assign a normal role to someone else", async () => {
    const supabase = makeClient({ profiles: { data: { is_super_admin: false }, error: null } });
    await expect(
      assertCanAssignRole(supabase, "caller-1", "member", "target-1"),
    ).resolves.toBeUndefined();
  });

  it("resolves a role id to its catalog key", async () => {
    const supabase = makeClient({ roles: { data: { key: "member" }, error: null } });
    await expect(resolveRoleKey(supabase, "role-1")).resolves.toBe("member");
  });

  it("rejects an unknown role id", async () => {
    const supabase = makeClient({ roles: { data: null, error: null } });
    await expect(resolveRoleKey(supabase, "role-missing")).rejects.toMatchObject({ status: 404 });
  });
});
