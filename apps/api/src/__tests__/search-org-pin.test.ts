import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";

/**
 * SEARCH-P2-009 regression tests.
 *
 * The router chain must be `requireAuth, requireOrgAccess, requireAdmin`:
 * `requireOrgAccess` resolves the authoritative tenant scope first so the
 * org-pinned branch of `requireAdmin` (ADMIN-P1-001) applies. Previously
 * `requireAdmin` ran first and a plain tenant `admin` passed it
 * org-agnostically, then read another tenant's search results through
 * `?organization_id`. These tests exercise the REAL middleware chain (the
 * sibling search-tenant-scope suite stubs it).
 */

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    JWT_SECRET: "test-jwt-secret",
    APP_BASE_URL: "http://localhost:3000",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../services/impersonation", () => ({ logImpersonation: jest.fn() }));
jest.mock("../lib/metrics", () => ({ recordSearchQuery: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import searchRouter from "../routes/search";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";
const authToken = "Bearer test-token";

type MembershipRow = {
  id: string;
  user_id: string;
  organization_id: string;
  roles: Array<{ id: string; key: string }>;
};

type MockResult = { data: unknown; error: unknown };

interface MembershipQueryBuilder {
  select: jest.Mock;
  eq: jest.Mock;
  in: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  maybeSingle: jest.Mock;
  then: (
    onfulfilled?: (value: MockResult) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
}

const membership = (roleKey: string): MembershipRow => ({
  id: "m1",
  user_id: "user-1",
  organization_id: ORG_A,
  roles: [{ id: `role-${roleKey}`, key: roleKey }],
});

/**
 * Filter-aware `memberships` builder. `requireOrgAccess` distinguishes the
 * single-membership check (`.eq("organization_id", …).maybeSingle()`) from the
 * all-memberships lookups, so the mock must answer each faithfully — a fixed
 * result would let the pre-fix middleware order satisfy these tests for the
 * wrong reason. `maybeSingle()` resolves a row-or-null; direct awaits resolve
 * row arrays (matching the real client).
 */
function membershipBuilder(rows: MembershipRow[]): MembershipQueryBuilder {
  const filters: Record<string, unknown> = {};
  let single = false;
  const builder: MembershipQueryBuilder = {
    select: jest.fn(),
    eq: jest.fn(),
    in: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn(),
    then(onfulfilled, onrejected) {
      const orgFilter = filters.organization_id;
      let matched = rows;
      if (typeof orgFilter === "string") {
        matched = rows.filter((row) => row.organization_id === orgFilter);
      } else if (Array.isArray(orgFilter)) {
        matched = rows.filter((row) => (orgFilter as string[]).includes(row.organization_id));
      }
      const data: MembershipRow[] | MembershipRow | null = single
        ? (matched[0] ?? null)
        : matched;
      return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
    },
  };
  builder.select.mockImplementation(() => builder);
  builder.eq.mockImplementation((column: string, value: unknown) => {
    filters[column] = value;
    return builder;
  });
  builder.in.mockImplementation((column: string, values: unknown) => {
    filters[column] = values;
    return builder;
  });
  builder.order.mockImplementation(() => builder);
  builder.limit.mockImplementation(() => builder);
  builder.maybeSingle.mockImplementation(() => {
    single = true;
    return builder;
  });
  return builder;
}

function installSupabase(memberships: MembershipRow[], opts: { isSuperAdmin?: boolean } = {}) {
  let profilesCalls = 0;
  const from = jest.fn((table: string) => {
    if (table === "memberships") return membershipBuilder(memberships);
    if (table === "profiles") {
      // First profiles call resolves the caller's is_super_admin flag; later
      // calls are the user search itself and expect row arrays.
      const first = profilesCalls === 0;
      profilesCalls += 1;
      return createMockBuilder(
        first
          ? { data: { is_super_admin: opts.isSuperAdmin ?? false }, error: null }
          : { data: [], error: null },
      );
    }
    return createMockBuilder({ data: [], error: null });
  });
  (getSupabaseAdmin as jest.Mock).mockReturnValue({
    from,
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "admin@example.com" } },
        error: null,
      }),
    },
  });
  return from;
}

const app = createTestApp();
app.use("/api/v1/search", searchRouter);
app.use(errorHandler);

describe("Search org-pinned admin check (SEARCH-P2-009)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("denies a tenant admin of org A when ?organization_id targets org B", async () => {
    const from = installSupabase([membership("admin")]);

    const res = await request(app)
      .get(`/api/v1/search?q=acme&organization_id=${ORG_B}`)
      .set("Authorization", authToken);

    expect(res.status).toBe(403);
    // Denied before the handler: no entity table is ever queried.
    const queriedTables = from.mock.calls.map((c) => c[0]);
    expect(queriedTables).not.toContain("tickets");
    expect(queriedTables).not.toContain("projects");
    expect(queriedTables).not.toContain("documents");
    expect(queriedTables).not.toContain("organizations");
  });

  it("allows a super_admin to target another tenant via ?organization_id", async () => {
    installSupabase([membership("super_admin")], { isSuperAdmin: true });

    const res = await request(app)
      .get(`/api/v1/search?q=acme&organization_id=${ORG_B}`)
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
  });

  it("still allows a tenant admin to search their own org", async () => {
    installSupabase([membership("admin")]);

    const res = await request(app)
      .get(`/api/v1/search?q=acme&organization_id=${ORG_A}`)
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
  });

  it("still allows a tenant admin to search without ?organization_id (own orgs only)", async () => {
    installSupabase([membership("admin")]);

    const res = await request(app)
      .get("/api/v1/search?q=acme")
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
  });
});
