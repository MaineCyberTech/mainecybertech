import { jest } from "@jest/globals";
import request from "supertest";
import businessOsRouter from "../routes/business-os";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";
import { invalidateCache } from "../middleware/cache";

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

jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin } from "../services/supabase";

const ORG_A = "00000000-0000-0000-0000-00000000000a";

type TableResults = Record<string, { data: unknown; error: unknown; count?: number }>;

function mockSupabase(tables: TableResults = {}) {
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
  const builders: Record<string, ReturnType<typeof createMockBuilder>> = {};
  supabase.from.mockImplementation((table: string) => {
    const result = tables[table] ?? { data: null, error: null, count: 0 };
    const builder = createMockBuilder(result);
    builders[table] = builder;
    return builder;
  });
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  });
  return { supabase, builders };
}

function superAdminTables(extra: TableResults = {}): TableResults {
  return {
    memberships: {
      data: [{ organization_id: ORG_A, roles: { id: "r", key: "super_admin" } }],
      error: null,
    },
    profiles: { data: { is_super_admin: true }, error: null },
    ...extra,
  };
}

function singleOrgAdminTables(extra: TableResults = {}): TableResults {
  return {
    memberships: {
      data: [{ organization_id: ORG_A, roles: { id: "r", key: "admin" } }],
      error: null,
    },
    profiles: { data: { is_super_admin: false }, error: null },
    ...extra,
  };
}

const app = createTestApp();
app.use("/api/v1/business-os", businessOsRouter);
app.use(errorHandler);

describe("business OS routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /summary", () => {
    it("returns business summary with all metrics for a cross-tenant admin", async () => {
      mockSupabase(
        superAdminTables({
          profiles: { data: { is_super_admin: true }, error: null, count: 10 },
          organizations: {
            data: [
              {
                id: "00000000-0000-0000-0000-000000000001",
                name: "Org One",
                status: "approved",
                created_at: "2025-01-01T00:00:00Z",
              },
              { id: "org-2", name: "Org Two", status: "pending", created_at: "2025-02-01T00:00:00Z" },
            ],
            error: null,
            count: 10,
          },
          tickets: { data: null, error: null, count: 10 },
          projects: { data: null, error: null, count: 10 },
          documents: { data: null, error: null, count: 10 },
          approval_requests: { data: null, error: null, count: 10 },
        }),
      );

      const res = await request(app)
        .get("/api/v1/business-os/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.organizations.total).toBe(2);
      expect(res.body.data.organizations.approved).toBe(1);
      expect(res.body.data.organizations.pending).toBe(1);
      expect(res.body.data.organizations.recent).toHaveLength(2);
      expect(res.body.data.tickets.open).toBe(10);
      expect(res.body.data.projects.active).toBe(10);
      expect(res.body.data.documents.total).toBe(10);
      expect(res.body.data.approvals.pending).toBe(10);
      expect(res.body.data.users.total).toBe(10);
    });

    it("returns 0 for null counts", async () => {
      mockSupabase(superAdminTables({ organizations: { data: [], error: null } }));

      const res = await request(app)
        .get("/api/v1/business-os/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        organizations: { total: 0, approved: 0, pending: 0, recent: [] },
        tickets: { open: 0 },
        projects: { active: 0 },
        documents: { total: 0 },
        approvals: { pending: 0 },
        users: { total: 0 },
      });
    });

    it("regression: scopes a single-org admin's summary to their own org", async () => {
      const { builders } = mockSupabase(singleOrgAdminTables());

      const res = await request(app)
        .get("/api/v1/business-os/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(builders.organizations.in).toHaveBeenCalledWith("id", [ORG_A]);
      for (const table of ["tickets", "projects", "documents", "approval_requests"]) {
        expect(builders[table].in).toHaveBeenCalledWith("organization_id", [ORG_A]);
      }
    });
  });

  describe("GET /recent-activity", () => {
    it("regression: scopes a single-org admin's activity feed to their own org", async () => {
      const { builders } = mockSupabase(singleOrgAdminTables());

      const res = await request(app)
        .get("/api/v1/business-os/recent-activity")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(builders.audit_logs.in).toHaveBeenCalledWith("organization_id", [ORG_A]);
    });

    it("leaves the feed unscoped for a genuine cross-tenant admin", async () => {
      const { builders } = mockSupabase(superAdminTables());

      const res = await request(app)
        .get("/api/v1/business-os/recent-activity")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(builders.audit_logs.in).not.toHaveBeenCalled();
    });
  });

  describe("GET /snapshots", () => {
    it("returns the snapshot history for a cross-tenant admin", async () => {
      mockSupabase(
        superAdminTables({
          business_os_snapshots: {
            data: [{ id: "s1", captured_at: "2026-09-01T00:00:00Z", metrics: { openTickets: 3 } }],
            error: null,
          },
        }),
      );

      const res = await request(app)
        .get("/api/v1/business-os/snapshots")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].metrics.openTickets).toBe(3);
    });

    it("regression: hides platform-level snapshots from a single-org admin", async () => {
      mockSupabase(
        singleOrgAdminTables({
          business_os_snapshots: {
            data: [{ id: "s1", captured_at: "2026-09-01T00:00:00Z", metrics: { openTickets: 3 } }],
            error: null,
          },
        }),
      );

      const res = await request(app)
        .get("/api/v1/business-os/snapshots")
        .set("Authorization", "Bearer token");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });
  });
});
