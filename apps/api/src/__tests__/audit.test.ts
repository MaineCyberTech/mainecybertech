import { jest } from "@jest/globals";
import request from "supertest";
import auditRouter from "../routes/audit";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
import { errorHandler } from "../middleware/error";

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

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

// requireOrgAccess is exercised by its own middleware suite; here we only need
// it to run without a DB lookup so the handler/scope logic is under test.
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@sentry/node", () => ({
  captureException: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";

type TableResults = Record<string, MockResult>;

function mockSupabase(tables: TableResults = {}, userId = "admin-1") {
  const supabase: {
    from: jest.Mock;
    auth: { getUser: jest.Mock };
  } = {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  };
  const builders: Record<string, ReturnType<typeof createMockBuilder>> = {};
  supabase.from.mockImplementation((table: string) => {
    const result = tables[table] ?? { data: [], error: null };
    const builder = createMockBuilder(result);
    builders[table] = builder;
    return builder;
  });
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userId, email: "admin@example.com" } },
    error: null,
  });
  return { supabase, builders };
}

/** Membership + profile fixtures for a single-org admin in ORG_A. */
function singleOrgAdminTables(extra: TableResults = {}): TableResults {
  return {
    memberships: {
      data: [{ organization_id: ORG_A, roles: { id: "role-admin", key: "admin" } }],
      error: null,
    },
    profiles: { data: { is_super_admin: false }, error: null },
    ...extra,
  };
}

const AUDIT_ENTRY = {
  id: "audit-1",
  action: "test.action",
  entity_type: "test",
  organization_id: ORG_A,
  created_at: "2026-01-01T00:00:00Z",
};

const app = createTestApp();
app.use("/api/v1/audit", auditRouter);
app.use(errorHandler);

describe("audit routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns paginated audit logs (admin only)", async () => {
      const { builders } = mockSupabase(
        singleOrgAdminTables({
          audit_logs: { data: [AUDIT_ENTRY], error: null, count: 1 },
        }),
      );

      const res = await request(app)
        .get("/api/v1/audit")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      // Scoped to the caller's own org, not left unscoped.
      expect(builders.audit_logs.in).toHaveBeenCalledWith("organization_id", [ORG_A]);
    });

    it("returns 403 when not an admin", async () => {
      mockSupabase({
        memberships: {
          data: [{ organization_id: ORG_A, roles: { id: "r", key: "client_user" } }],
          error: null,
        },
        profiles: { data: { is_super_admin: false }, error: null },
        audit_logs: { data: [], error: null },
      });

      const res = await request(app)
        .get("/api/v1/audit")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
    });

    it("supports actor_user_id filter", async () => {
      mockSupabase(
        singleOrgAdminTables({
          audit_logs: { data: [AUDIT_ENTRY], error: null, count: 1 },
        }),
      );

      const res = await request(app)
        .get("/api/v1/audit?actor_user_id=user-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
    });
  });

  describe("regression: tenant isolation (MT-P1-001 / ADMIN-P1-001)", () => {
    it("scopes an org-A admin's list to org A when no org is requested", async () => {
      const { builders } = mockSupabase(
        singleOrgAdminTables({
          audit_logs: { data: [AUDIT_ENTRY], error: null, count: 1 },
        }),
      );

      const res = await request(app)
        .get("/api/v1/audit")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(builders.audit_logs.in).toHaveBeenCalledWith("organization_id", [ORG_A]);
      // Never widened to an unscoped query.
      expect(builders.audit_logs.eq).not.toHaveBeenCalledWith("organization_id", ORG_B);
    });

    it("rejects an org-A admin requesting org B's audit rows", async () => {
      mockSupabase(
        singleOrgAdminTables({
          audit_logs: { data: [AUDIT_ENTRY], error: null, count: 1 },
        }),
      );

      const res = await request(app)
        .get(`/api/v1/audit?organization_id=${ORG_B}`)
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
    });

    it("scopes an org-A admin's export to org A", async () => {
      const { builders } = mockSupabase(
        singleOrgAdminTables({
          audit_logs: { data: [AUDIT_ENTRY], error: null },
        }),
      );

      const res = await request(app)
        .get("/api/v1/audit/export?format=json")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(builders.audit_logs.in).toHaveBeenCalledWith("organization_id", [ORG_A]);
    });

    it("rejects an org-A admin exporting org B's audit rows", async () => {
      mockSupabase(
        singleOrgAdminTables({
          audit_logs: { data: [AUDIT_ENTRY], error: null },
        }),
      );

      const res = await request(app)
        .get(`/api/v1/audit/export?organization_id=${ORG_B}`)
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
    });

    it("allows a genuine cross-tenant super_admin to read every tenant", async () => {
      const { builders } = mockSupabase({
        memberships: {
          data: [{ organization_id: ORG_A, roles: { id: "r", key: "super_admin" } }],
          error: null,
        },
        profiles: { data: { is_super_admin: true }, error: null },
        audit_logs: { data: [AUDIT_ENTRY], error: null, count: 1 },
      });

      const res = await request(app)
        .get("/api/v1/audit")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      // No org predicate applied for a true platform admin.
      expect(builders.audit_logs.in).not.toHaveBeenCalledWith("organization_id", expect.anything());
    });
  });
});
