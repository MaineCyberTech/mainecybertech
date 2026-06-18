import { jest } from "@jest/globals";
import request from "supertest";
import rolesRouter from "../routes/roles";
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
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";

function mockAuth() {
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  });
  return supabase;
}

const ROLE = { id: "role-1", key: "admin", name: "Admin" };

const app = createTestApp();
app.use("/api/v1/roles", rolesRouter);
app.use(errorHandler);

describe("roles routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns a list of roles", async () => {
      mockAuth();
      const result: MockResult = { data: [ROLE], error: null };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder(result),
      );

      const res = await request(app)
        .get("/api/v1/roles")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].key).toBe("admin");
    });

    it("filters by ids", async () => {
      mockAuth();
      const result: MockResult = { data: [ROLE], error: null };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder(result),
      );

      const res = await request(app)
        .get("/api/v1/roles?ids=role-1,role-2")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /with-permissions", () => {
    function createPermsTestApp(forbidden = false) {
      const testApp = createTestApp();
      testApp.use((req: any, _res: any, next: any) => {
        req.authUser = { userId: "admin-1" };
        next();
      });
      if (forbidden) {
        testApp.use((_req: any, res: any, _next: any) => {
          res
            .status(403)
            .json({
              success: false,
              error: {
                code: "FORBIDDEN",
                message: "Admin access required",
                status: 403,
              },
            });
        });
      }
      testApp.get("/api/v1/roles/with-permissions", async (req, res, next) => {
        try {
          const supabase = getSupabaseAdmin();
          const { data: roles } = await supabase
            .from("roles")
            .select("id, key, name, description, is_system")
            .order("name");
          const { data: counts } = await supabase
            .from("role_permissions")
            .select("role_id, permission_id");
          if (!roles) throw new Error("Failed to fetch roles");
          const countMap = new Map<string, number>();
          for (const rp of counts ?? []) {
            countMap.set(rp.role_id, (countMap.get(rp.role_id) ?? 0) + 1);
          }
          const result = roles.map((r: any) => ({
            ...r,
            permissionCount: countMap.get(r.id) ?? 0,
          }));
          res.json({ success: true, data: result });
        } catch (error) {
          next(error);
        }
      });
      return testApp;
    }

    function mockFromCalls(from: jest.Mock, results: MockResult[]) {
      results.forEach((r) => from.mockReturnValueOnce(createMockBuilder(r)));
    }

    it("returns roles with permission counts", async () => {
      const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
      (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
      mockFromCalls(supabase.from, [
        {
          data: [
            { id: "r1", key: "admin", name: "Admin", is_system: true },
            { id: "r2", key: "user", name: "User", is_system: false },
          ],
          error: null,
        },
        {
          data: [
            { role_id: "r1", permission_id: "p1" },
            { role_id: "r1", permission_id: "p2" },
            { role_id: "r2", permission_id: "p3" },
          ],
          error: null,
        },
      ]);

      const testApp = createPermsTestApp();
      const res = await request(testApp).get("/api/v1/roles/with-permissions");
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].permissionCount).toBe(2);
      expect(res.body.data[1].permissionCount).toBe(1);
    });

    it("returns zero counts for roles without permissions", async () => {
      const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
      (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
      mockFromCalls(supabase.from, [
        {
          data: [{ id: "r1", key: "viewer", name: "Viewer", is_system: false }],
          error: null,
        },
        { data: [], error: null },
      ]);

      const testApp = createPermsTestApp();
      const res = await request(testApp).get("/api/v1/roles/with-permissions");
      expect(res.status).toBe(200);
      expect(res.body.data[0].permissionCount).toBe(0);
    });

    it("blocks non-admin users with 403", async () => {
      const testApp = createPermsTestApp(true);
      const res = await request(testApp).get("/api/v1/roles/with-permissions");
      expect(res.status).toBe(403);
    });
  });

  describe("GET /:id", () => {
    it("returns a role by id", async () => {
      mockAuth();
      const result: MockResult = { data: ROLE, error: null };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder(result),
      );

      const res = await request(app)
        .get("/api/v1/roles/role-1")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("role-1");
    });

    it("returns 404 when not found", async () => {
      mockAuth();
      const result: MockResult = { data: null, error: new Error("Not found") };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(
        createMockBuilder(result),
      );

      const res = await request(app)
        .get("/api/v1/roles/missing")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });
});
