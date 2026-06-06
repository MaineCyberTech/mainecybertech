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
  
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";

function mockAuth() {
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "admin@example.com" } },
    error: null,
  });
  return supabase;
}

function mockAdmin() {
  const supabase = mockAuth();
  supabase.from
    .mockReturnValueOnce(createMockBuilder({
      data: [{ roles: { id: "role-admin", key: "admin" } }],
      error: null,
    }));
  return supabase;
}

const USER = { id: "user-1", email: "test@example.com", full_name: "Test User" };

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
      const result: MockResult = { data: [USER], error: null };
      supabase.from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });

    it("returns 403 when not an admin", async () => {
      const supabase = mockAuth();
      supabase.from
        .mockReturnValueOnce(createMockBuilder({ data: [], error: null }));

      const res = await request(app)
        .get("/api/v1/users")
        .set("Authorization", "Bearer token-123");

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

    it("returns 404 when not found", async () => {
      mockAuth();
      const result: MockResult = { data: null, error: new Error("Not found") };
      (getSupabaseAdmin as jest.Mock)().from.mockReturnValue(createMockBuilder(result));

      const res = await request(app)
        .get("/api/v1/users/missing")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /:id/role", () => {
    it("updates a user role (admin only)", async () => {
      const supabase = mockAdmin();
      supabase.from
        .mockReturnValue(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .patch("/api/v1/users/user-1/role")
        .set("Authorization", "Bearer token-123")
        .send({ roleId: "role-admin" });

      expect(res.status).toBe(200);
      expect(res.body.data.updated).toBe(true);
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
      const supabase = mockAuth();
      const profileBuilder = createMockBuilder({ data: { id: "user-1", full_name: "Test User", email: "test@example.com" }, error: null });
      const membershipBuilder = createMockBuilder({ data: [{ id: "m1", organization_id: "org-1", user_id: "user-1", role_id: "r1", status: "approved" }], error: null });
      const orgBuilder = createMockBuilder({ data: [{ id: "org-1", name: "Test Org" }], error: null });
      const roleBuilder = createMockBuilder({ data: [{ id: "r1", key: "admin", name: "Admin" }], error: null });
      const allRolesBuilder = createMockBuilder({ data: [{ id: "r1", key: "admin", name: "Admin" }], error: null });

      let callCount = 0;
      supabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return profileBuilder;
        if (callCount === 2) return membershipBuilder;
        if (callCount === 3) return orgBuilder;
        if (callCount === 4) return roleBuilder;
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
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: null, error: { message: "Not found" } }));

      const res = await request(app)
        .get("/api/v1/users/nonexistent/detail")
        .set("Authorization", "Bearer token-123");

      expect(res.status).toBe(404);
    });
  });
});
