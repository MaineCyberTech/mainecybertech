import { jest } from "@jest/globals";
import request from "supertest";
import dashboardRouter from "../routes/dashboard";
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

// The admin/org gates have dedicated suites; stub them here so the handler's
// tenant-scoping is what's under test.
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin } from "../services/supabase";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";

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

function singleOrgAdminTables(count = 5): TableResults {
  return {
    memberships: {
      data: [{ organization_id: ORG_A, roles: { id: "r", key: "admin" } }],
      error: null,
    },
    profiles: { data: { is_super_admin: false }, error: null, count },
  };
}

const app = createTestApp();
app.use("/api/v1/dashboard", dashboardRouter);
app.use(errorHandler);

describe("dashboard routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidateCache();
  });

  describe("GET /summary", () => {
    it("returns counts for all dashboard metrics", async () => {
      mockSupabase({
        memberships: {
          data: [{ organization_id: ORG_A, roles: { id: "r", key: "admin" } }],
          error: null,
          count: 5,
        },
        profiles: { data: { is_super_admin: false }, error: null },
        organizations: { data: null, error: null, count: 5 },
        tickets: { data: null, error: null, count: 5 },
        projects: { data: null, error: null, count: 5 },
        documents: { data: null, error: null, count: 5 },
      });

      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        managedServices: 5,
        openTickets: 5,
        activeProjects: 5,
        totalDocuments: 5,
        pendingMemberships: 5,
      });
    });

    it("defaults null counts to 0", async () => {
      mockSupabase({
        memberships: singleOrgAdminTables().memberships,
        profiles: { data: { is_super_admin: false }, error: null },
      });

      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        managedServices: 0,
        openTickets: 0,
        activeProjects: 0,
        totalDocuments: 0,
        pendingMemberships: 0,
      });
    });

    it("regression: scopes a single-org admin's counts to their own org", async () => {
      const { builders } = mockSupabase({
        memberships: singleOrgAdminTables().memberships,
        profiles: { data: { is_super_admin: false }, error: null },
      });

      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(builders.organizations.in).toHaveBeenCalledWith("id", [ORG_A]);
      for (const table of ["tickets", "projects", "documents", "memberships"]) {
        expect(builders[table].in).toHaveBeenCalledWith("organization_id", [ORG_A]);
      }
    });

    it("leaves counts unscoped for a genuine cross-tenant super_admin", async () => {
      const { builders } = mockSupabase({
        memberships: {
          data: [{ organization_id: ORG_A, roles: { id: "r", key: "super_admin" } }],
          error: null,
        },
        profiles: { data: { is_super_admin: true }, error: null },
      });

      const res = await request(app)
        .get("/api/v1/dashboard/summary")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(builders.organizations.in).not.toHaveBeenCalled();
      expect(builders.tickets.in).not.toHaveBeenCalled();
    });
  });
});
