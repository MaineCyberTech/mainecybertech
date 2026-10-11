import { jest } from "@jest/globals";
import request from "supertest";
import usersRouter from "../routes/users";
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

import { getSupabaseAdmin } from "../services/supabase";
import { logAuditEvent } from "../services/audit";

function mockAuth() {
  const supabase = {
    from: jest.fn(),
    auth: { getUser: jest.fn(), admin: { deleteUser: jest.fn() } },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "admin@example.com" } },
    error: null,
  });
  supabase.auth.admin.deleteUser.mockResolvedValue({ data: { user: null }, error: null });
  return supabase;
}

function mockAdmin() {
  const supabase = mockAuth();
  supabase.from.mockReturnValueOnce(
    createMockBuilder({
      data: [{ roles: { id: "role-admin", key: "admin" } }],
      error: null,
    }),
  );
  return supabase;
}

const USER = { id: "user-1", email: "test@example.com", full_name: "Test User" };

/*
 * Route-level suites: auth/permission middleware is stubbed so the shared
 * Supabase mock serves only route queries. Middleware enforcement itself is
 * covered by security-suite / edge-cases / dedicated middleware tests.
 */
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
  assertOrgScopeMatches: jest.fn(),
  assertSharesActiveOrg: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../middleware/permissions", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
const app = createTestApp();
app.use("/api/v1/users", usersRouter);
app.use(errorHandler);

describe("users routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns a list of users (admin only)", async () => {
      const supabase = mockAdmin();
      const result: MockResult = { data: [USER], error: null, count: 1 };
      supabase.from.mockReturnValue(createMockBuilder(result));

      const res = await request(app).get("/api/v1/users").set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(25);
    });

    it("returns 403 when not an admin", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(createMockBuilder({ data: [], error: null }));

      const res = await request(app).get("/api/v1/users").set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
    });
  });

  describe("GET /:id", () => {
    it("returns a user by id", async () => {
      mockAuth();
      const result: MockResult = { data: USER, error: null };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/users/user-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("user-1");
    });

    it("returns 404 when not found (admin viewing other user)", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(
        createMockBuilder({ data: { roles: { id: "role-admin", key: "admin" } }, error: null }),
      );
      const result: MockResult = { data: null, error: new Error("Not found") };
      supabase.from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/users/missing")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });

    it("returns 403 when non-admin views another user", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValueOnce(
        createMockBuilder({
          data: { roles: { id: "role-user", key: "client_user" } },
          error: null,
        }),
      );
      const result: MockResult = { data: USER, error: null };
      supabase.from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/users/user-2")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /:id/role", () => {
    it("updates a user role (admin only)", async () => {
      // mockAuth (not mockAdmin): the queued admin fixture would be consumed
      // by the new role lookup instead of the admin middleware, hiding the
      // guard under test.
      const supabase = mockAuth();
      supabase.from.mockImplementation((table: string) => {
        if (table === "roles") return createMockBuilder({ data: { key: "member" }, error: null });
        if (table === "profiles")
          return createMockBuilder({ data: { is_super_admin: true }, error: null });
        return createMockBuilder({ data: null, error: null });
      });

      const res = await request(app)
        .patch("/api/v1/users/user-1/role")
        .set("Authorization", "Bearer token-123")
        .send({ roleId: "role-admin", organizationId: "org-1" });

      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBe(true);
    });

    it("rejects a non-super-admin granting a cross-tenant role [SEC-P1-001]", async () => {
      const supabase = mockAuth();
      supabase.from.mockImplementation((table: string) => {
        if (table === "roles") return createMockBuilder({ data: { key: "admin" }, error: null });
        if (table === "profiles")
          return createMockBuilder({ data: { is_super_admin: false }, error: null });
        return createMockBuilder({ data: null, error: null });
      });

      const res = await request(app)
        .patch("/api/v1/users/user-2/role")
        .set("Authorization", "Bearer token-123")
        .send({ roleId: "role-admin", organizationId: "org-1" });

      expect(res.status).toBe(403);
    });

    it("returns 400 when roleId missing", async () => {
      mockAdmin();

      const res = await request(app)
        .patch("/api/v1/users/user-1/role")
        .set("Authorization", "Bearer token-123")
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("GET /:id/detail", () => {
    it("returns compound user detail in a single call", async () => {
      const supabase = mockAdmin();
      const profileBuilder = createMockBuilder({
        data: { id: "user-1", full_name: "Test User", email: "test@example.com" },
        error: null,
      });
      const membershipBuilder = createMockBuilder({
        data: [
          {
            id: "m1",
            organization_id: "00000000-0000-0000-0000-000000000001",
            user_id: "user-1",
            role_id: "r1",
            status: "approved",
          },
        ],
        error: null,
      });
      const orgBuilder = createMockBuilder({
        data: [{ id: "00000000-0000-0000-0000-000000000001", name: "Test Org" }],
        error: null,
      });
      const roleBuilder = createMockBuilder({
        data: [{ id: "r1", key: "admin", name: "Admin" }],
        error: null,
      });
      const allRolesBuilder = createMockBuilder({
        data: [{ id: "r1", key: "admin", name: "Admin" }],
        error: null,
      });

      // mockAdmin() consumes the first from() call (requireAdmin membership check)
      let callCount = 1;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 2) return profileBuilder;
        if (callCount === 3) return membershipBuilder;
        if (callCount === 4) return orgBuilder;
        if (callCount === 5) return roleBuilder;
        return allRolesBuilder;
      });

      const res = await request(app)
        .get("/api/v1/users/user-1/detail")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.memberships).toBeDefined();
      expect(res.body.data.organizations).toBeDefined();
      expect(res.body.data.roles).toBeDefined();
      expect(res.body.data.allRoles).toBeDefined();
    });

    it("returns 404 when user not found", async () => {
      const supabase = mockAdmin();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: null, error: { message: "Not found", code: "PGRST116" } }),
      );

      const res = await request(app)
        .get("/api/v1/users/nonexistent/detail")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /:id/export (DSAR access)", () => {
    it("exports the subject's identity bundle and audits the export", async () => {
      const supabase = mockAuth();
      const profile = { id: "user-1", full_name: "Test User", email: "test@example.com" };
      supabase.from.mockImplementation((table: string) => {
        if (table === "profiles") return createMockBuilder({ data: profile, error: null });
        return createMockBuilder({ data: [], error: null });
      });

      const res = await request(app)
        .get("/api/v1/users/user-1/export")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.subject).toBe("user-1");
      expect(res.body.data.profile.id).toBe("user-1");
      expect(res.body.data.memberships).toEqual([]);
      expect(res.body.data.permissionOverrides).toEqual([]);
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "user.data.export", entityId: "user-1" }),
      );
    });

    it("allows an admin to export another user in their org", async () => {
      const supabase = mockAuth();
      let membershipCalls = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === "memberships") {
          membershipCalls++;
          return membershipCalls === 1
            ? createMockBuilder({ data: { roles: { id: "r1", key: "admin" } }, error: null })
            : createMockBuilder({ data: [], error: null });
        }
        if (table === "profiles") return createMockBuilder({ data: { id: "user-2" }, error: null });
        return createMockBuilder({ data: [], error: null });
      });

      const res = await request(app)
        .get("/api/v1/users/user-2/export")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.subject).toBe("user-2");
    });

    it("returns 403 when a non-admin exports another user", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: { roles: { id: "r1", key: "client_user" } }, error: null }),
      );

      const res = await request(app)
        .get("/api/v1/users/user-2/export")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
    });

    it("returns 404 when the subject does not exist", async () => {
      const supabase = mockAuth();
      supabase.from.mockImplementation((table: string) => {
        if (table === "memberships") {
          return createMockBuilder({ data: { roles: { id: "r1", key: "admin" } }, error: null });
        }
        return createMockBuilder({ data: null, error: { message: "Not found", code: "PGRST116" } });
      });

      const res = await request(app)
        .get("/api/v1/users/missing/export")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id (DSAR erasure)", () => {
    it("scrubs the profile and deletes the auth user (super admin only)", async () => {
      const supabase = mockAuth();
      const scrubBuilder = createMockBuilder({ data: null, error: null });
      let profileCalls = 0;
      supabase.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          profileCalls++;
          if (profileCalls === 1) {
            return createMockBuilder({ data: { is_super_admin: true }, error: null });
          }
          if (profileCalls === 2) return createMockBuilder({ data: { id: "user-2" }, error: null });
          return scrubBuilder;
        }
        return createMockBuilder({ data: null, error: null });
      });

      const res = await request(app)
        .delete("/api/v1/users/user-2")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(204);
      expect(scrubBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: null,
          email: null,
          phone: null,
          title: null,
          encrypted_pii: null,
        }),
      );
      expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith("user-2");
      expect(logAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: "user.account.erased", entityId: "user-2" }),
      );
    });

    it("rejects a caller who is not a super admin", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({ data: { is_super_admin: false }, error: null }),
      );

      const res = await request(app)
        .delete("/api/v1/users/user-2")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(403);
      expect(supabase.auth.admin.deleteUser).not.toHaveBeenCalled();
    });

    it("refuses self-erasure", async () => {
      const supabase = mockAuth();

      const res = await request(app)
        .delete("/api/v1/users/user-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(400);
      expect(supabase.auth.admin.deleteUser).not.toHaveBeenCalled();
    });

    it("returns 404 when the target does not exist", async () => {
      const supabase = mockAuth();
      let profileCalls = 0;
      supabase.from.mockImplementation(() => {
        profileCalls++;
        return createMockBuilder({
          data: profileCalls === 1 ? { is_super_admin: true } : null,
          error: null,
        });
      });

      const res = await request(app)
        .delete("/api/v1/users/missing")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
      expect(supabase.auth.admin.deleteUser).not.toHaveBeenCalled();
    });
  });
});
