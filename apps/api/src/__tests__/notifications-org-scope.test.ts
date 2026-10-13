import { jest } from "@jest/globals";
import request from "supertest";
import notificationsRouter from "../routes/notifications";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";
import { AppError } from "../types";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
    JWT_SECRET: "test-secret-that-is-long-enough-for-zod",
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));

jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock("@sentry/node", () => ({ captureException: jest.fn() }));

// MT-P3-002: pin the caller to org A so the route's recipient/org checks are
// observable without the real org-resolution middleware. The id is declared
// inside the factory because jest.mock factories are hoisted above the module
// body (a top-level const would be in TDZ when the factory runs).
jest.mock("../middleware/org-access", () => {
  const orgA = "00000000-0000-0000-0000-00000000000a";
  return {
    requireOrgAccess: (req: any, _res: unknown, next: () => void) => {
      req.orgScope = { orgId: orgA, explicit: true, platformAdmin: false, impersonation: false };
      req.orgId = orgA;
      next();
    },
    assertSharesActiveOrg: jest.fn(),
    assertOrgScopeMatches: jest.fn(),
  };
});

jest.mock("../lib/notify", () => ({
  createNotification: jest.fn(),
  buildNotificationKey: jest.fn(() => "key-from-helper"),
}));

import { getSupabaseAdmin } from "../services/supabase";
import { assertSharesActiveOrg, assertOrgScopeMatches } from "../middleware/org-access";
import { createNotification } from "../lib/notify";

const ORG_A = "00000000-0000-0000-0000-00000000000a";
const ORG_B = "00000000-0000-0000-0000-00000000000b";

type Builder = ReturnType<typeof createMockBuilder>;

function mockSupabase(tables: Record<string, Builder> = {}) {
  const supabase = {
    from: jest.fn((table: string) => tables[table] ?? createMockBuilder({ data: [], error: null })),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "admin-1", email: "admin@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

/** Approved admin membership so requireAdmin passes. */
function adminTables(extra: Record<string, Builder> = {}): Record<string, Builder> {
  return {
    memberships: createMockBuilder({
      data: [{ organization_id: ORG_A, roles: { id: "role-admin", key: "admin" } }],
      error: null,
    }),
    profiles: createMockBuilder({ data: { is_super_admin: false }, error: null }),
    ...extra,
  };
}

const app = createTestApp();
app.use("/api/v1/notifications", notificationsRouter);
app.use(errorHandler);

const VALID_BODY = {
  userId: "user-1",
  title: "Manual notice",
  body: "An admin-authored notification.",
  module: "tickets",
  moduleId: "ticket-1",
  action: "created",
};

describe("admin notification create org scoping (MT-P3-002)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects a recipient who does not share the caller's org", async () => {
    mockSupabase(adminTables());
    (assertSharesActiveOrg as jest.Mock).mockRejectedValueOnce(
      new AppError("FORBIDDEN", "You do not share an organization with this user", 403),
    );

    const res = await request(app)
      .post("/api/v1/notifications")
      .set("Authorization", "Bearer token-123")
      .send(VALID_BODY);

    expect(res.status).toBe(403);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("defaults the row's organization to the caller's resolved org", async () => {
    mockSupabase(
      adminTables({
        notifications: createMockBuilder({ data: { id: "n1" }, error: null }),
      }),
    );
    (assertSharesActiveOrg as jest.Mock).mockResolvedValue(undefined);
    (createNotification as jest.Mock).mockResolvedValue({
      inserted: true,
      deduped: false,
      suppressed: false,
    });

    const res = await request(app)
      .post("/api/v1/notifications")
      .set("Authorization", "Bearer token-123")
      .send(VALID_BODY);

    expect(res.status).toBe(201);
    expect(assertSharesActiveOrg).toHaveBeenCalledWith(expect.anything(), "user-1");
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", organizationId: ORG_A }),
    );
  });

  it("checks a body organizationId against the caller's org", async () => {
    mockSupabase(adminTables());
    (assertSharesActiveOrg as jest.Mock).mockResolvedValue(undefined);
    (assertOrgScopeMatches as jest.Mock).mockImplementationOnce(() => {
      throw new AppError(
        "FORBIDDEN",
        "You can only manage resources in your active organization",
        403,
      );
    });

    const res = await request(app)
      .post("/api/v1/notifications")
      .set("Authorization", "Bearer token-123")
      .send({ ...VALID_BODY, organizationId: ORG_B });

    expect(res.status).toBe(403);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("applies the resolved org to the notification list", async () => {
    const notifications = createMockBuilder({ data: [], error: null, count: 0 });
    mockSupabase(adminTables({ notifications }));

    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", "Bearer token-123");

    expect(res.status).toBe(200);
    expect(notifications.eq).toHaveBeenCalledWith("organization_id", ORG_A);
  });

  it("applies the resolved org to the unread count", async () => {
    const notifications = createMockBuilder({ data: [], error: null, count: 2 });
    mockSupabase(adminTables({ notifications }));

    const res = await request(app)
      .get("/api/v1/notifications/unread-count")
      .set("Authorization", "Bearer token-123");

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(2);
    expect(notifications.eq).toHaveBeenCalledWith("organization_id", ORG_A);
  });
});
