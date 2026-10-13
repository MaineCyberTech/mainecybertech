import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder  } from "./helpers";
import { errorHandler } from "../middleware/error";

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

jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn(),
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()) }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import bulkRouter from "../routes/bulk";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";

const ADMIN_MEMBER = { id: "m-1", roles: { id: "role-admin", key: "admin" } };

function mockAuthAndAdmin() {
  const supabase = {
    from: jest.fn(),
    auth: {
      admin: { createUser: jest.fn(), inviteUserByEmail: jest.fn() },
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

/*
 * Route-level suites: auth/permission middleware is stubbed so the shared
 * Supabase mock serves only route queries. Middleware enforcement itself is
 * covered by security-suite / edge-cases / dedicated middleware tests.
 */
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/permissions", () => ({
  requirePermission:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));
const app = createTestApp();
app.use("/api/v1/bulk", bulkRouter);
app.use(errorHandler);

describe("Bulk API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("validates required fields on invite", async () => {
    const supabase = mockAuthAndAdmin();
    supabase.from.mockReturnValue(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns error for invalid email in CSV", async () => {
    const supabase = mockAuthAndAdmin();
    // requireAdmin → memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // SEC-P1-001 role guard -> resolveRoleKey (non-cross-tenant role)
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { key: "member" }, error: null }));
    // PERF-P2-004: invalid rows are rejected before any profile/membership
    // lookup, so no further query is issued.

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        csv: "not-an-email\n",
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.results[0].status).toBe("error");
  });

  it("returns results for valid CSV with new user", async () => {
    const supabase = mockAuthAndAdmin();
    // requireAdmin → memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // SEC-P1-001 role guard -> resolveRoleKey (non-cross-tenant role)
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { key: "member" }, error: null }));
    // profiles query → no existing user
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));
    // auth.admin.inviteUserByEmail → success (unconfirmed account)
    supabase.auth.admin.inviteUserByEmail.mockResolvedValue({
      data: { user: { id: "new-user-1" } },
      error: null,
    });
    // memberships query → no existing membership
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));
    // memberships insert → success
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { id: "m-1" }, error: null }));

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        csv: "new@example.com,New User\n",
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.results).toBeDefined();
    expect(Array.isArray(res.body.data.results)).toBe(true);
    // ADMIN-P2-004: accounts are created via the email-confirmation invite
    // flow, never pre-confirmed.
    expect(supabase.auth.admin.inviteUserByEmail).toHaveBeenCalledWith("new@example.com", {
      data: { full_name: "New User" },
    });
    expect(supabase.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("accepts the invites array payload (SDK/web form shape)", async () => {
    const supabase = mockAuthAndAdmin();
    // requireAdmin ? memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // SEC-P1-001 role guard -> resolveRoleKey (non-cross-tenant role)
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { key: "member" }, error: null }));
    // profiles query ? no existing user
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));
    // auth.admin.inviteUserByEmail ? success
    supabase.auth.admin.inviteUserByEmail.mockResolvedValue({
      data: { user: { id: "new-user-2" } },
      error: null,
    });
    // memberships query ? no existing membership
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));
    // memberships insert ? success
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { id: "m-3" }, error: null }));

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        invites: [{ email: "new2@example.com", fullName: "New Two" }],
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.results[0].status).toBe("invited");
  });

  it("never pre-confirms newly invited accounts (ADMIN-P2-004)", async () => {
    const supabase = mockAuthAndAdmin();
    // requireAdmin → memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // SEC-P1-001 role guard -> resolveRoleKey (non-cross-tenant role)
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { key: "member" }, error: null }));
    // profiles query → no existing user
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));
    // auth.admin.inviteUserByEmail → success (unconfirmed account)
    supabase.auth.admin.inviteUserByEmail.mockResolvedValue({
      data: { user: { id: "new-user-4" } },
      error: null,
    });
    // memberships query → no existing membership
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));
    // memberships insert → success
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { id: "m-4" }, error: null }));

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        invites: [{ email: "confirm@example.com" }],
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.results[0].status).toBe("invited");
    expect(res.body.data.results[0].message).toMatch(/email confirmation/i);
    expect(supabase.auth.admin.inviteUserByEmail).toHaveBeenCalledTimes(1);
    expect(supabase.auth.admin.createUser).not.toHaveBeenCalled();
  });

  it("invites an existing user that has no membership", async () => {
    const supabase = mockAuthAndAdmin();
    // requireAdmin → memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // SEC-P1-001 role guard -> resolveRoleKey (non-cross-tenant role)
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { key: "member" }, error: null }));
    // profiles query → existing user found (batched `in` lookup)
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [{ id: "existing-user", email: "existing@example.com" }],
        error: null,
      }),
    );
    // memberships query → no existing membership
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));
    // memberships insert → success
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { id: "m-2" }, error: null }));

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        csv: "existing@example.com,Existing User\n",
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.results[0].status).toBe("invited");
  });

  it("batches the profile/membership lookups and inserts memberships once [PERF-P2-004]", async () => {
    const supabase = mockAuthAndAdmin();
    // requireAdmin → memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // SEC-P1-001 role guard -> resolveRoleKey (non-cross-tenant role)
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { key: "member" }, error: null }));
    // one batched profiles lookup resolves both addresses
    supabase.from.mockReturnValueOnce(
      createMockBuilder({
        data: [
          { id: "user-a", email: "a@example.com" },
          { id: "user-b", email: "b@example.com" },
        ],
        error: null,
      }),
    );
    // one batched membership lookup → neither has a membership yet
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [], error: null }));
    // one multi-row membership insert for both invites
    const insertBuilder = createMockBuilder({ data: [{ id: "m-1" }], error: null });
    supabase.from.mockReturnValueOnce(insertBuilder);

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        invites: [{ email: "a@example.com" }, { email: "b@example.com" }],
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.results.map((r: { status: string }) => r.status)).toEqual([
      "invited",
      "invited",
    ]);

    // Two invites cost: requireAdmin + role guard + one profiles query + one
    // membership lookup + one insert = 5 calls. The old per-invite loop cost
    // 2 + 4 per invite = 10.
    expect(supabase.from).toHaveBeenCalledTimes(5);
    expect(
      supabase.from.mock.calls.filter(([table]: [string]) => table === "profiles"),
    ).toHaveLength(1);
    expect(insertBuilder.insert).toHaveBeenCalledTimes(1);
    const inserted = (insertBuilder.insert as jest.Mock).mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(inserted).toHaveLength(2);
    expect(inserted[0]).toMatchObject({
      organization_id: testOrgId,
      user_id: "user-a",
      status: "pending",
    });
    expect(inserted[1]).toMatchObject({ user_id: "user-b", status: "pending" });
    // Existing profiles need no auth invite.
    expect(supabase.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("keeps one invite call per new user and one insert per chunk [PERF-P2-004]", async () => {
    const supabase = mockAuthAndAdmin();
    // requireAdmin → memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // SEC-P1-001 role guard -> resolveRoleKey (non-cross-tenant role)
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { key: "member" }, error: null }));
    // batched profiles lookup → neither address has a profile yet
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [], error: null }));
    // auth.admin.inviteUserByEmail stays per user (ADMIN-P2-004 flow)
    supabase.auth.admin.inviteUserByEmail
      .mockResolvedValueOnce({ data: { user: { id: "new-u1" } }, error: null })
      .mockResolvedValueOnce({ data: { user: { id: "new-u2" } }, error: null });
    // batched membership lookup → no memberships yet
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [], error: null }));
    // one multi-row insert for both pending memberships
    const insertBuilder = createMockBuilder({ data: [{ id: "m-1" }], error: null });
    supabase.from.mockReturnValueOnce(insertBuilder);

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        invites: [{ email: "n1@example.com" }, { email: "n2@example.com" }],
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.results.map((r: { status: string }) => r.status)).toEqual([
      "invited",
      "invited",
    ]);
    expect(supabase.auth.admin.inviteUserByEmail).toHaveBeenCalledTimes(2);
    expect(insertBuilder.insert).toHaveBeenCalledTimes(1);
    // Same 5-call budget as the existing-profile batch: only the per-user
    // auth invite scales with the batch size.
    expect(supabase.from).toHaveBeenCalledTimes(5);
  });

  it("chunks lookups and inserts once per chunk past the chunk size [PERF-P2-004]", async () => {
    const supabase = mockAuthAndAdmin();
    const entries = Array.from({ length: 101 }, (_, i) => ({ email: `bulk${i}@example.com` }));
    const profileRow = (i: number) => ({ id: `bulk-user-${i}`, email: `bulk${i}@example.com` });

    // requireAdmin → memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // SEC-P1-001 role guard -> resolveRoleKey (non-cross-tenant role)
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { key: "member" }, error: null }));
    // chunk 1 profiles (100), then chunk 1 membership lookup + insert
    supabase.from.mockReturnValueOnce(
      createMockBuilder({ data: entries.slice(0, 100).map((_, i) => profileRow(i)), error: null }),
    );
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [], error: null }));
    const insertBuilder = createMockBuilder({ data: [{ id: "m-1" }], error: null });
    supabase.from.mockReturnValueOnce(insertBuilder);
    // chunk 2 profiles (1), then chunk 2 membership lookup + insert
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [profileRow(100)], error: null }));
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [], error: null }));
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [{ id: "m-2" }], error: null }));

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        invites: entries,
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.results).toHaveLength(101);
    expect(res.body.data.results.every((r: { status: string }) => r.status === "invited")).toBe(
      true,
    );
    // 2 middleware + (profiles + memberships + insert) × 2 chunks = 8 calls
    // for 101 invites; the per-invite loop would have made 406.
    expect(supabase.from).toHaveBeenCalledTimes(8);
    expect(insertBuilder.insert).toHaveBeenCalledTimes(1);
    const firstInsert = (insertBuilder.insert as jest.Mock).mock.calls[0][0] as unknown[];
    expect(firstInsert).toHaveLength(100);
    expect(supabase.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .send({
        csv: "test@test.com\n",
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });
    expect(res.status).toBe(401);
  });
});
