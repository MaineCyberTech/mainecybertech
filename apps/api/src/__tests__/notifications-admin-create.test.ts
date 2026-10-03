import { jest } from "@jest/globals";
import request from "supertest";
import notificationsRouter from "../routes/notifications";
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

jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

// The whole point of the fix: the admin route must delegate to the
// preference-aware helper instead of inserting directly (NOTIF-P1-001).
jest.mock("../lib/notify", () => ({
  createNotification: jest.fn(),
  buildNotificationKey: jest.fn(() => "key-from-helper"),
}));

jest.mock("../lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock("@sentry/node", () => ({ captureException: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import { createNotification, buildNotificationKey } from "../lib/notify";
import { logAuditEvent } from "../services/audit";

const ORG_A = "00000000-0000-0000-0000-00000000000a";

type TableResults = Record<string, MockResult>;

function mockSupabase(tables: TableResults = {}, userId = "admin-1") {
  const supabase: { from: jest.Mock; auth: { getUser: jest.Mock } } = {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  };
  supabase.from.mockImplementation((table: string) => {
    const result = tables[table] ?? { data: [], error: null };
    return createMockBuilder(result);
  });
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userId, email: "admin@example.com" } },
    error: null,
  });
  return supabase;
}

/** Approved admin membership so requireAdmin passes. */
function adminTables(extra: TableResults = {}): TableResults {
  return {
    memberships: {
      data: [{ organization_id: ORG_A, roles: { id: "role-admin", key: "admin" } }],
      error: null,
    },
    profiles: { data: { is_super_admin: false }, error: null },
    ...extra,
  };
}

const app = createTestApp();
app.use("/api/v1/notifications", notificationsRouter);
app.use(errorHandler);

const VALID_BODY = {
  userId: "user-1",
  organizationId: ORG_A,
  title: "Manual notice",
  body: "An admin-authored notification.",
  module: "tickets",
  moduleId: "ticket-1",
  action: "created",
};

describe("admin POST /notifications routes through preference enforcement (NOTIF-P1-001)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("delegates the insert to createNotification instead of inserting directly", async () => {
    mockSupabase(
      adminTables({
        notifications: { data: { id: "n1", ...VALID_BODY }, error: null },
      }),
    );
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
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", module: "tickets", action: "created" }),
    );
    expect(buildNotificationKey).toHaveBeenCalled();
  });

  it("does not insert when the recipient disabled the in-app channel", async () => {
    const supabase = mockSupabase(adminTables());
    (createNotification as jest.Mock).mockResolvedValue({
      inserted: false,
      deduped: false,
      suppressed: true,
    });

    const res = await request(app)
      .post("/api/v1/notifications")
      .set("Authorization", "Bearer token-123")
      .send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(res.body.data.suppressed).toBe(true);
    // No direct insert against the notifications table.
    expect(supabase.from).not.toHaveBeenCalledWith("notifications");
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "notification.create" }),
    );
  });

  it("reports a dedup hit without creating a second row", async () => {
    mockSupabase(
      adminTables({
        notifications: { data: { id: "n-existing", ...VALID_BODY }, error: null },
      }),
    );
    (createNotification as jest.Mock).mockResolvedValue({
      inserted: false,
      deduped: true,
      suppressed: false,
    });

    const res = await request(app)
      .post("/api/v1/notifications")
      .set("Authorization", "Bearer token-123")
      .send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("n-existing");
  });
});
