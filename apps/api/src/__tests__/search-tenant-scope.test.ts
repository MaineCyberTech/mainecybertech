import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";

/**
 * API-P2-001 regression tests.
 *
 * `search.ts` must trust the tenant scope resolved by `requireOrgAccess`
 * (`req.orgScope`) and fail closed:
 *   - an admin whose resolved org set is empty returns no rows (never an
 *     unscoped cross-tenant query);
 *   - an explicitly requested organization narrows the search, even for a
 *     cross-tenant super admin;
 *   - the only all-tenants path (super_admin with no explicit org) is audited.
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
    SMTP_HOST: "",
    EMAIL_FROM: "noreply@test.local",
    SENTRY_DSN: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    PUBLIC_TRAFFIC_WEBHOOK_URL: "",
    PUBLIC_LEAD_WEBHOOK_URL: "",
    JSM_DOMAIN: "",
    JSM_EMAIL: "",
    JSM_API_TOKEN: "",
    JSM_SERVICEDESK_ID: "",
    JSM_REQUEST_TYPE_ID: "",
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../middleware/auth", () => ({
  requireAuth: (req: any, _res: unknown, next: () => void) => {
    req.authUser = { userId: "user-1", email: "admin@example.com" };
    next();
  },
}));
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

type MockScope = {
  orgId: string | null;
  explicit: boolean;
  platformAdmin: boolean;
  impersonation: boolean;
};
const mockOrgScope: { current: MockScope } = {
  current: { orgId: null, explicit: false, platformAdmin: false, impersonation: false },
};

jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (req: any, _res: unknown, next: () => void) => {
    req.orgScope = mockOrgScope.current;
    req.orgId = mockOrgScope.current.orgId;
    next();
  },
}));

import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import searchRouter from "../routes/search";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";
const authToken = "Bearer test-token";

const app = createTestApp();
app.use("/api/v1/search", searchRouter);
app.use(errorHandler);

function mockSupabase(opts: { isSuperAdmin: boolean; memberships: unknown[] }) {
  const builders: Record<string, any[]> = {};
  const supabase = {
    from: jest.fn((table: string) => {
      const rowsFor = (): unknown => {
        if (table === "profiles") {
          // First call resolves `is_super_admin`; later calls are the user
          // search itself, which expects row arrays.
          return (builders.profiles?.length ?? 0) === 0
            ? { is_super_admin: opts.isSuperAdmin }
            : [];
        }
        if (table === "memberships") {
          // First call resolves the caller's orgs/roles; later calls resolve
          // the member user ids for the scoped orgs.
          return (builders.memberships?.length ?? 0) === 0 ? opts.memberships : [];
        }
        return [];
      };
      const builder = createMockBuilder({ data: rowsFor(), error: null });
      (builders[table] ??= []).push(builder);
      return builder;
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "admin@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return builders;
}

describe("Search tenant scope (API-P2-001)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrgScope.current = {
      orgId: null,
      explicit: false,
      platformAdmin: false,
      impersonation: false,
    };
  });

  it("fails closed when the caller resolves to no organization", async () => {
    // Non-super-admin with no approved memberships and no explicit org scope.
    const builders = mockSupabase({ isSuperAdmin: false, memberships: [] });

    const res = await request(app)
      .get("/api/v1/search?q=acme")
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      users: [],
      organizations: [],
      tickets: [],
      projects: [],
      documents: [],
    });

    // Every tenant-owned query must be an explicit no-match predicate, never
    // an unscoped query.
    for (const table of ["organizations", "tickets", "projects", "documents"]) {
      const builder = builders[table]?.[0];
      expect(builder).toBeDefined();
      expect(builder.in).toHaveBeenCalledWith(expect.any(String), ["__no_match__"]);
    }
  });

  it("narrows to an explicitly requested org even for a cross-tenant super admin", async () => {
    mockOrgScope.current = {
      orgId: ORG_B,
      explicit: true,
      platformAdmin: false,
      impersonation: false,
    };
    const builders = mockSupabase({
      isSuperAdmin: true,
      memberships: [{ organization_id: ORG_A, roles: [{ id: "r1", key: "super_admin" }] }],
    });

    const res = await request(app)
      .get(`/api/v1/search?q=acme&organization_id=${ORG_B}`)
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
    const orgBuilder = builders.organizations?.[0];
    expect(orgBuilder).toBeDefined();
    expect(orgBuilder.in).toHaveBeenCalledWith("id", [ORG_B]);
    expect(orgBuilder.in).not.toHaveBeenCalledWith("id", [ORG_A]);

    const call = (logAuditEvent as jest.Mock).mock.calls[0][0] as {
      metadata: Record<string, unknown>;
    };
    expect(call.metadata.allTenants).toBe(false);
  });

  it("allows and audits the all-tenants path for a super admin with no explicit org", async () => {
    const builders = mockSupabase({
      isSuperAdmin: true,
      memberships: [{ organization_id: ORG_A, roles: [{ id: "r1", key: "super_admin" }] }],
    });

    const res = await request(app)
      .get("/api/v1/search?q=acme")
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
    const orgBuilder = builders.organizations?.[0];
    expect(orgBuilder).toBeDefined();
    expect(orgBuilder.in).not.toHaveBeenCalled();

    const call = (logAuditEvent as jest.Mock).mock.calls[0][0] as {
      metadata: Record<string, unknown>;
    };
    expect(call.metadata.allTenants).toBe(true);
  });

  it("fails closed when a super admin's membership list is empty", async () => {
    const builders = mockSupabase({ isSuperAdmin: true, memberships: [] });

    const res = await request(app)
      .get("/api/v1/search?q=acme")
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.organizations).toEqual([]);
    const orgBuilder = builders.organizations?.[0];
    expect(orgBuilder.in).toHaveBeenCalledWith("id", ["__no_match__"]);
  });
});
