import { jest } from "@jest/globals";
import request from "supertest";
import meRouter from "../routes/me";
import { createTestApp, createMockBuilder } from "./helpers";
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
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()),
}));

import { getSupabaseAdmin } from "../services/supabase";

function mockAuth(userId = "user-1") {
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userId, email: "test@example.com" } },
    error: null,
  });
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/me", meRouter);
app.use(errorHandler);

describe("GET /api/v1/me/permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns all permissions for super admins", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValueOnce(
      createMockBuilder({ data: { id: "u1", is_super_admin: true }, error: null }),
    );
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [
          { id: "p1", module_key: "tickets", action_key: "view", description: null },
          { id: "p2", module_key: "users", action_key: "view", description: null },
        ],
        error: null,
      }),
    );

    const res = await request(app)
      .get("/api/v1/me/permissions")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isSuperAdmin).toBe(true);
    expect(res.body.data.keys).toEqual(["tickets:view", "users:view"]);
    expect(res.body.data.roles).toEqual(["super_admin"]);
  });

  it("returns empty permissions for users with no approved memberships", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValueOnce(
      createMockBuilder({ data: { id: "u1", is_super_admin: false }, error: null }),
    );
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [], error: null }));

    const res = await request(app)
      .get("/api/v1/me/permissions")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      isSuperAdmin: false,
      permissions: [],
      keys: [],
      roles: [],
      memberships: [],
    });
  });

  it("computes union of role permissions across orgs", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValueOnce(
      createMockBuilder({ data: { id: "u1", is_super_admin: false }, error: null }),
    );
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [
          {
            id: "m1",
            organization_id: "org-1",
            role_id: "role-a",
            status: "approved",
            roles: { key: "client_admin" },
          },
          {
            id: "m2",
            organization_id: "org-2",
            role_id: "role-b",
            status: "approved",
            roles: { key: "client_user" },
          },
        ],
        error: null,
      }),
    );
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [
          { role_id: "role-a", permission_id: "p1" },
          { role_id: "role-b", permission_id: "p2" },
        ],
        error: null,
      }),
    );
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [], error: null }));
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [
          { id: "p1", module_key: "tickets", action_key: "view", description: null },
          { id: "p2", module_key: "documents", action_key: "view", description: null },
        ],
        error: null,
      }),
    );

    const res = await request(app)
      .get("/api/v1/me/permissions")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.data.isSuperAdmin).toBe(false);
    expect(res.body.data.keys.sort()).toEqual(["documents:view", "tickets:view"]);
    expect(res.body.data.roles).toEqual(["client_admin", "client_user"]);
    expect(res.body.data.memberships).toHaveLength(2);
  });

  it("applies per-org overrides (deny removes, allow adds)", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValueOnce(
      createMockBuilder({ data: { id: "u1", is_super_admin: false }, error: null }),
    );
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [
          {
            id: "m1",
            organization_id: "org-1",
            role_id: "role-a",
            status: "approved",
            roles: { key: "client_user" },
          },
        ],
        error: null,
      }),
    );
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [{ role_id: "role-a", permission_id: "p1" }],
        error: null,
      }),
    );
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [
          { organization_id: "org-1", permission_id: "p1", is_allowed: false },
          { organization_id: "org-1", permission_id: "p2", is_allowed: true },
        ],
        error: null,
      }),
    );
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [{ id: "p2", module_key: "billing", action_key: "view", description: null }],
        error: null,
      }),
    );

    const res = await request(app)
      .get("/api/v1/me/permissions")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.data.keys).toEqual(["billing:view"]);
  });

  it("resolves permissions for a new-catalog role (engineer)", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValueOnce(
      createMockBuilder({ data: { id: "u1", is_super_admin: false }, error: null }),
    );
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [
          {
            id: "m1",
            organization_id: "org-1",
            role_id: "role-eng",
            status: "approved",
            roles: { key: "engineer" },
          },
        ],
        error: null,
      }),
    );
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [
          { role_id: "role-eng", permission_id: "p-ticket" },
          { role_id: "role-eng", permission_id: "p-asset" },
        ],
        error: null,
      }),
    );
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [], error: null }));
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [
          { id: "p-ticket", module_key: "tickets", action_key: "view", description: null },
          { id: "p-asset", module_key: "assets", action_key: "edit", description: null },
        ],
        error: null,
      }),
    );

    const res = await request(app)
      .get("/api/v1/me/permissions")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(200);
    expect(res.body.data.isSuperAdmin).toBe(false);
    expect(res.body.data.keys.sort()).toEqual(["assets:edit", "tickets:view"]);
    expect(res.body.data.roles).toEqual(["engineer"]);
  });

  it("returns 401 when unauthenticated", async () => {
    const supabase = mockAuth();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: "x" } });

    const res = await request(app)
      .get("/api/v1/me/permissions")
      .set("Authorization", "Bearer test-token");

    expect(res.status).toBe(401);
  });
});
