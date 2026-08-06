import { jest } from "@jest/globals";
import request from "supertest";
import express, { type Request, type Response, type NextFunction } from "express";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "production",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
    JWT_SECRET: "test-secret",
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { requirePermission } from "../middleware/permissions";

const ORG = "00000000-0000-0000-0000-000000000001";
const OTHER_ORG = "00000000-0000-0000-0000-000000000099";

function mockReq(opts: { userId?: string; orgId?: string; bodyOrgId?: string } = {}) {
  return {
    authUser: opts.userId ? { userId: opts.userId, email: "test@example.com" } : undefined,
    query: opts.orgId ? { organization_id: opts.orgId } : {},
    body: opts.bodyOrgId ? { organizationId: opts.bodyOrgId } : {},
    headers: {},
    cookies: {},
  } as unknown as Request;
}

function mockRes() {
  return { status: jest.fn(), json: jest.fn() } as unknown as Response;
}

/**
 * Seed supabase.from with ordered results for each call the middleware
 * makes. Excess calls fall back to an empty-result builder (memberships
 * empty -> no permissions), so tests only mock the meaningful calls.
 */
function mockSupabase(results: MockResult[]) {
  const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  for (const r of results) {
    supabase.from.mockReturnValueOnce(createMockBuilder(r));
  }
  supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));
  return supabase;
}

function membership(roleKey: string, orgId = ORG, roleId = "role-a") {
  return {
    id: `m-${roleId}`,
    organization_id: orgId,
    role_id: roleId,
    status: "approved",
    roles: { key: roleKey },
  };
}

const NOT_SUPER = { data: { id: "u1", is_super_admin: false }, error: null };
const SUPER = { data: { id: "u1", is_super_admin: true }, error: null };

describe("requirePermission middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("grants when the user's role has the module:action key", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      { data: [{ role_id: "role-a", permission_id: "p1" }], error: null },
      { data: [], error: null },
      {
        data: [{ id: "p1", module_key: "tickets", action_key: "create", description: null }],
        error: null,
      },
    ]);
    const next = jest.fn();

    await requirePermission("tickets", "create")(mockReq({ userId: "user-1", orgId: ORG }), mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("denies with 403 when the role lacks the key", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      { data: [{ role_id: "role-a", permission_id: "p1" }], error: null },
      { data: [], error: null },
      {
        data: [{ id: "p1", module_key: "tickets", action_key: "view", description: null }],
        error: null,
      },
    ]);
    const next = jest.fn();

    await requirePermission("tickets", "delete")(mockReq({ userId: "user-1", orgId: ORG }), mockRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 403, code: "FORBIDDEN", message: "You do not have permission" }),
    );
  });

  it("grants via an allow override even when the role lacks the permission", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      { data: [], error: null },
      { data: [{ organization_id: ORG, permission_id: "p2", is_allowed: true }], error: null },
      {
        data: [{ id: "p2", module_key: "billing", action_key: "manage", description: null }],
        error: null,
      },
    ]);
    const next = jest.fn();

    await requirePermission("billing", "manage")(mockReq({ userId: "user-1", orgId: ORG }), mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("denies when a deny override removes the role's permission", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      { data: [{ role_id: "role-a", permission_id: "p1" }], error: null },
      { data: [{ organization_id: ORG, permission_id: "p1", is_allowed: false }], error: null },
    ]);
    const next = jest.fn();

    await requirePermission("tickets", "create")(mockReq({ userId: "user-1", orgId: ORG }), mockRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 403, code: "FORBIDDEN" }),
    );
  });

  it("bypasses for super_admin profiles", async () => {
    mockSupabase([
      SUPER,
      {
        data: [{ id: "p1", module_key: "tickets", action_key: "delete", description: null }],
        error: null,
      },
    ]);
    const next = jest.fn();

    await requirePermission("tickets", "delete")(mockReq({ userId: "user-1", orgId: ORG }), mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("bypasses for admin role memberships (requireAdmin parity)", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("admin", ORG, "role-admin")], error: null },
      { data: [{ role_id: "role-admin", permission_id: "p1" }], error: null },
      { data: [], error: null },
      {
        data: [{ id: "p1", module_key: "tickets", action_key: "view", description: null }],
        error: null,
      },
    ]);
    const next = jest.fn();

    await requirePermission("api-keys", "manage")(mockReq({ userId: "user-1", orgId: ORG }), mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("scopes to the resolved org: grants when the membership is in that org", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      { data: [{ role_id: "role-a", permission_id: "p1" }], error: null },
      { data: [], error: null },
      {
        data: [{ id: "p1", module_key: "projects", action_key: "create", description: null }],
        error: null,
      },
    ]);
    const next = jest.fn();

    await requirePermission("projects", "create")(mockReq({ userId: "user-1", orgId: ORG }), mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("scopes to the resolved org: denies when the membership is in a different org", async () => {
    // First resolution scoped to OTHER_ORG finds no memberships (calls 1-2);
    // the org-agnostic fallback finds the membership in ORG but only grants
    // admin/super_admin bypass, so the request is still denied.
    mockSupabase([
      NOT_SUPER,
      { data: [], error: null },
      NOT_SUPER,
      { data: [membership("client_user")], error: null },
      { data: [{ role_id: "role-a", permission_id: "p1" }], error: null },
      { data: [], error: null },
      {
        data: [{ id: "p1", module_key: "tickets", action_key: "create", description: null }],
        error: null,
      },
    ]);
    const next = jest.fn();

    await requirePermission("tickets", "create")(mockReq({ userId: "user-1", orgId: OTHER_ORG }), mockRes(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 403, code: "FORBIDDEN" }),
    );
  });

  it("allows admin cross-tenant operations via the org-agnostic fallback", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [], error: null },
      NOT_SUPER,
      { data: [membership("admin", ORG, "role-admin")], error: null },
      { data: [{ role_id: "role-admin", permission_id: "p1" }], error: null },
      { data: [], error: null },
      {
        data: [{ id: "p1", module_key: "organizations", action_key: "view", description: null }],
        error: null,
      },
    ]);
    const next = jest.fn();

    await requirePermission("organizations", "manage")(mockReq({ userId: "user-1", orgId: OTHER_ORG }), mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("resolves without an explicit org by unioning all approved memberships", async () => {
    mockSupabase([
      NOT_SUPER,
      { data: [membership("client_user", ORG)], error: null },
      { data: [{ role_id: "role-a", permission_id: "p1" }], error: null },
      { data: [], error: null },
      {
        data: [{ id: "p1", module_key: "tickets", action_key: "create", description: null }],
        error: null,
      },
    ]);
    const next = jest.fn();

    await requirePermission("tickets", "create")(mockReq({ userId: "user-1" }), mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("returns 401 when no authUser is present", async () => {
    mockSupabase([]);
    const next = jest.fn();

    await requirePermission("tickets", "create")(mockReq({}), mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });
});

describe("requirePermission in the Express pipeline", () => {
  it("responds 403 FORBIDDEN 'You do not have permission' for denied requests", async () => {
    const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));

    const app = createTestApp();
    const router = express.Router();
    router.use((req: Request, _res: Response, next: NextFunction) => {
      req.authUser = { userId: "user-1", email: "test@example.com" };
      next();
    });
    router.post("/tickets", requirePermission("tickets", "create"), (_req, res) => {
      res.json({ success: true, data: { ok: true } });
    });
    app.use("/api/v1/test", router);
    app.use(errorHandler);

    const res = await request(app).post("/api/v1/test/tickets").send({ organizationId: ORG });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe("FORBIDDEN");
    expect(res.body.error?.message).toBe("You do not have permission");
  });

  it("passes requests through when the permission is granted", async () => {
    const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
    supabase.from
      .mockReturnValueOnce(createMockBuilder({ data: { id: "u1", is_super_admin: true }, error: null }))
      .mockReturnValueOnce(
        createMockBuilder({
          data: [{ id: "p1", module_key: "tickets", action_key: "create", description: null }],
          error: null,
        }),
      )
      .mockReturnValue(createMockBuilder({ data: [], error: null }));

    const app = createTestApp();
    const router = express.Router();
    router.use((req: Request, _res: Response, next: NextFunction) => {
      req.authUser = { userId: "user-1", email: "test@example.com" };
      next();
    });
    router.post("/tickets", requirePermission("tickets", "create"), (_req, res) => {
      res.json({ success: true, data: { ok: true } });
    });
    app.use("/api/v1/test", router);
    app.use(errorHandler);

    const res = await request(app).post("/api/v1/test/tickets").send({ organizationId: ORG });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ ok: true });
  });

  it("denies change-request approve to a member without the manage permission (CAB gate)", async () => {
    const supabase = { from: jest.fn(), auth: { getUser: jest.fn() } };
    (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
    supabase.from
      .mockReturnValueOnce(createMockBuilder({ data: { id: "u1", is_super_admin: false }, error: null }))
      .mockReturnValueOnce(createMockBuilder({ data: [membership("client_user")], error: null }))
      .mockReturnValue(createMockBuilder({ data: [], error: null }));

    const app = createTestApp();
    const router = express.Router();
    router.use((req: Request, _res: Response, next: NextFunction) => {
      req.authUser = { userId: "user-1", email: "test@example.com" };
      next();
    });
    router.post(
      "/change-requests/:id/approve",
      requirePermission("change-requests", "manage"),
      (_req, res) => {
        res.json({ success: true, data: { ok: true } });
      },
    );
    app.use("/api/v1/governance", router);
    app.use(errorHandler);

    const res = await request(app)
      .post("/api/v1/governance/change-requests/ch-1/approve")
      .send({ organizationId: ORG });

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe("FORBIDDEN");
  });
});
