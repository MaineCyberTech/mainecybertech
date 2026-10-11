import { jest } from "@jest/globals";
import request from "supertest";
import {
  createMockBuilder,
  createOrgAccessStub,
  createTestApp,
  type MockResult,
} from "./helpers";
import webhookManagementRouter from "../routes/webhook-management";
import { errorHandler } from "../middleware/error";

const ORG = "00000000-0000-0000-0000-000000000001";

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
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../middleware/org-access", () =>
  createOrgAccessStub("00000000-0000-0000-0000-000000000001"),
);
// NOTE: `../middleware/permissions` is intentionally NOT mocked. These tests
// pin the real requirePermission chain (WH-P2-007 / ACM-P2-004): a member
// without `webhooks:view` must be denied on every read route.

import { getSupabaseAdmin } from "../services/supabase";

const app = createTestApp();
app.use("/api/v1/webhook-endpoints", webhookManagementRouter);
app.use(errorHandler);

/**
 * Serve the real permission resolver's fixture tables for an approved
 * technician membership in ORG. The technician role is NOT an admin bypass
 * role, so access is decided purely by the granted permission row.
 */
function mockMember(withWebhooksView: boolean) {
  const supabase: any = { from: jest.fn(), auth: { getUser: jest.fn() } };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "member-1", email: "member@test.com" } },
    error: null,
  });

  const permission = withWebhooksView
    ? { id: "perm-wh-view", module_key: "webhooks", action_key: "view" }
    : { id: "perm-tickets-view", module_key: "tickets", action_key: "view" };

  supabase.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return createMockBuilder({ data: { is_super_admin: false }, error: null } as MockResult);
    }
    if (table === "memberships") {
      return createMockBuilder({
        data: [
          {
            id: "membership-1",
            organization_id: ORG,
            role_id: "role-1",
            status: "approved",
            roles: { id: "role-1", key: "technician" },
          },
        ],
        error: null,
      } as MockResult);
    }
    if (table === "role_permissions") {
      return createMockBuilder({
        data: [{ role_id: "role-1", permission_id: permission.id }],
        error: null,
      } as MockResult);
    }
    if (table === "user_permission_overrides") {
      return createMockBuilder({ data: [], error: null } as MockResult);
    }
    if (table === "permissions") {
      return createMockBuilder({ data: [permission], error: null } as MockResult);
    }
    return createMockBuilder({ data: [], error: null, count: 0 } as MockResult);
  });

  return supabase;
}

describe("webhook read routes require webhooks:view [WH-P2-007 / ACM-P2-004]", () => {
  beforeEach(() => jest.clearAllMocks());

  const readRoutes = [
    "/api/v1/webhook-endpoints",
    "/api/v1/webhook-endpoints/dead-letters",
    "/api/v1/webhook-endpoints/wh1",
    "/api/v1/webhook-endpoints/wh1/deliveries",
  ];

  it.each(readRoutes)("403 for an org member without webhooks:view: GET %s", async (path) => {
    mockMember(false);

    const res = await request(app).get(path).set("Authorization", "Bearer token");

    expect(res.status).toBe(403);
    expect(res.body.error?.code).toBe("FORBIDDEN");
  });

  it("200 for an org member holding webhooks:view", async () => {
    mockMember(true);

    const res = await request(app)
      .get("/api/v1/webhook-endpoints")
      .set("Authorization", "Bearer token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
