import { jest } from "@jest/globals";
import { createMockBuilder } from "./helpers";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    LOG_LEVEL: "silent",
  }),
}));

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import { resolveEffectivePermissions, clearPermissionCache } from "../lib/permissions";

const ORG = "00000000-0000-0000-0000-000000000001";
const OTHER_ORG = "00000000-0000-0000-0000-000000000002";

/**
 * Serve the resolver's fixture tables. A non-super member resolution costs
 * five `from()` calls: profiles, memberships, role_permissions,
 * user_permission_overrides, permissions.
 */
function mockSupabase() {
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return createMockBuilder({ data: { is_super_admin: false }, error: null });
    }
    if (table === "memberships") {
      return createMockBuilder({
        data: [
          {
            id: "m-1",
            organization_id: ORG,
            role_id: "role-a",
            status: "approved",
            roles: { key: "client_user" },
          },
        ],
        error: null,
      });
    }
    if (table === "role_permissions") {
      return createMockBuilder({
        data: [{ role_id: "role-a", permission_id: "p1" }],
        error: null,
      });
    }
    if (table === "user_permission_overrides") {
      return createMockBuilder({ data: [], error: null });
    }
    if (table === "permissions") {
      return createMockBuilder({
        data: [{ id: "p1", module_key: "tickets", action_key: "create", description: null }],
        error: null,
      });
    }
    return createMockBuilder({ data: [], error: null });
  });
  return supabase;
}

describe("resolveEffectivePermissions cache [PERF-P2-003]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearPermissionCache();
  });

  it("serves the second resolution from cache without re-querying", async () => {
    const supabase = mockSupabase();

    const first = await resolveEffectivePermissions("user-1", ORG);
    const callsAfterFirst = supabase.from.mock.calls.length;
    const second = await resolveEffectivePermissions("user-1", ORG);

    expect(second).toBe(first);
    expect(second.keys.has("tickets:create")).toBe(true);
    expect(supabase.from.mock.calls.length).toBe(callsAfterFirst);
  });

  it("dedupes concurrent resolutions for the same key", async () => {
    const supabase = mockSupabase();

    const [a, b] = await Promise.all([
      resolveEffectivePermissions("user-2", ORG),
      resolveEffectivePermissions("user-2", ORG),
    ]);

    expect(a).toBe(b);
    expect(supabase.from.mock.calls.length).toBe(5);
  });

  it("keeps separate entries per org scope", async () => {
    const supabase = mockSupabase();

    await resolveEffectivePermissions("user-3", ORG);
    const callsAfterFirst = supabase.from.mock.calls.length;
    await resolveEffectivePermissions("user-3", OTHER_ORG);

    expect(supabase.from.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it("clearPermissionCache(userId) invalidates only that user", async () => {
    const supabase = mockSupabase();

    await resolveEffectivePermissions("user-4", ORG);
    await resolveEffectivePermissions("user-5", ORG);
    const callsAfterBoth = supabase.from.mock.calls.length;

    clearPermissionCache("user-4");
    await resolveEffectivePermissions("user-4", ORG);
    expect(supabase.from.mock.calls.length).toBe(callsAfterBoth + 5);

    // The other user's entry survived the targeted invalidation.
    await resolveEffectivePermissions("user-5", ORG);
    expect(supabase.from.mock.calls.length).toBe(callsAfterBoth + 5);
  });

  it("clearPermissionCache() drops every entry", async () => {
    const supabase = mockSupabase();

    await resolveEffectivePermissions("user-6", ORG);
    const callsAfterFirst = supabase.from.mock.calls.length;

    clearPermissionCache();
    await resolveEffectivePermissions("user-6", ORG);

    expect(supabase.from.mock.calls.length).toBe(callsAfterFirst + 5);
  });
});
