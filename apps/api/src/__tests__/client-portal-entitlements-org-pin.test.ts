import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";

/**
 * MT-P2-007 regression tests.
 *
 * `/client-portal/entitlements` (GET + PUT) must run `requireOrgAccess` before
 * `requireAdmin` so the org-pinned admin check applies to the requested
 * organization. Previously a plain tenant `admin` passed the org-agnostic
 * admin gate first, then read/wrote another tenant's entitlements. These tests
 * exercise the REAL middleware chain (the sibling client-portal suite stubs
 * it).
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
  getScopedClient: jest.fn(() => ({ from: jest.fn() })),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../services/impersonation", () => ({ logImpersonation: jest.fn() }));
jest.mock("../middleware/cache", () => ({
  responseCacheNoRenew: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  invalidateCache: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import clientPortalRouter from "../routes/client-portal";

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

function installSupabase(
  memberships: MembershipRow[],
  opts: { entitlements?: Array<{ module_key: string; enabled: boolean }> } = {},
) {
  const from = jest.fn((table: string) => {
    if (table === "memberships") return membershipBuilder(memberships);
    if (table === "client_portal_entitlements") {
      return createMockBuilder({ data: opts.entitlements ?? [], error: null });
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
app.use("/api/v1/client-portal", clientPortalRouter);
app.use(errorHandler);

describe("Client-portal entitlements org-pinned admin check (MT-P2-007)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("denies a tenant admin of org A reading org B entitlements", async () => {
    const from = installSupabase([membership("admin")]);

    const res = await request(app)
      .get(`/api/v1/client-portal/entitlements?organization_id=${ORG_B}`)
      .set("Authorization", authToken);

    expect(res.status).toBe(403);
    // Denied before the handler: entitlements are never read.
    expect(from.mock.calls.map((c) => c[0])).not.toContain("client_portal_entitlements");
  });

  it("denies a tenant admin of org A writing org B entitlements", async () => {
    const from = installSupabase([membership("admin")]);

    const res = await request(app)
      .put("/api/v1/client-portal/entitlements")
      .set("Authorization", authToken)
      .send({
        organizationId: ORG_B,
        modules: [{ moduleKey: "dashboard", enabled: true }],
      });

    expect(res.status).toBe(403);
    // Denied before the handler: entitlements are never written.
    expect(from.mock.calls.map((c) => c[0])).not.toContain("client_portal_entitlements");
  });

  it("allows a super_admin to read another tenant's entitlements", async () => {
    installSupabase([membership("super_admin")], {
      entitlements: [{ module_key: "dashboard", enabled: true }],
    });

    const res = await request(app)
      .get(`/api/v1/client-portal/entitlements?organization_id=${ORG_B}`)
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([{ module_key: "dashboard", enabled: true }]);
  });

  it("allows a super_admin to write another tenant's entitlements", async () => {
    installSupabase([membership("super_admin")]);

    const res = await request(app)
      .put("/api/v1/client-portal/entitlements")
      .set("Authorization", authToken)
      .send({
        organizationId: ORG_B,
        modules: [{ moduleKey: "dashboard", enabled: true }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(1);
  });

  it("still allows a tenant admin to read their own org entitlements", async () => {
    installSupabase([membership("admin")], {
      entitlements: [{ module_key: "dashboard", enabled: true }],
    });

    const res = await request(app)
      .get(`/api/v1/client-portal/entitlements?organization_id=${ORG_A}`)
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([{ module_key: "dashboard", enabled: true }]);
  });
});
