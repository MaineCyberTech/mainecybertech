import { jest } from "@jest/globals";
import request from "supertest";
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
    JWT_SECRET: "test-jwt-secret",
    APP_BASE_URL: "http://localhost:3000",
    API_PORT: 4000,
  }),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

const mockFrom = jest.fn();
jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  getScopedClient: jest.fn(() => ({ from: mockFrom })),
}));
// Cache middleware would otherwise replay a cached 200 for the fixed URL.
jest.mock("../middleware/cache", () => ({
  responseCacheNoRenew: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  invalidateCache: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import clientPortalRouter from "../routes/client-portal";

const authToken = "Bearer test-token";

function mockAuth() {
  (getSupabaseAdmin as jest.Mock).mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
  });
}

const membership = {
  id: "m1",
  organization_id: "org-1",
  role_id: "r1",
  status: "approved",
  organizations: [{ id: "org-1", name: "Acme" }],
  roles: [{ id: "r1", key: "client_admin", name: "Client Admin" }],
};

function wireTables(overrides: {
  profiles?: unknown;
  memberships?: unknown;
  subscriptions?: unknown;
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "profiles")
      return createMockBuilder({ data: overrides.profiles ?? null, error: null });
    if (table === "memberships")
      return createMockBuilder({ data: overrides.memberships ?? [], error: null });
    if (table === "subscriptions")
      return createMockBuilder({ data: overrides.subscriptions ?? [], error: null });
    return createMockBuilder({ data: null, error: null });
  });
}

const app = createTestApp();
app.use("/api/v1/client-portal", clientPortalRouter);
app.use(errorHandler);

describe("Client Portal API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("bootstraps profile and memberships with subscription-gated modules", async () => {
    mockAuth();
    wireTables({
      profiles: { full_name: "Test User", email: "test@example.com" },
      memberships: [membership],
      subscriptions: [
        {
          organization_id: "org-1",
          status: "active",
          plan_name: "Pro",
          current_period_end: "2027-01-01",
        },
      ],
    });

    const res = await request(app)
      .get("/api/v1/client-portal/bootstrap")
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.profile.fullName).toBe("Test User");
    const m = res.body.data.memberships[0];
    expect(m.organizationName).toBe("Acme");
    expect(m.roleKey).toBe("client_admin");
    expect(m.subscription.planName).toBe("Pro");
    expect(m.enabledModules).toContain("findings");
  });

  it("falls back to the default module set without an active subscription", async () => {
    mockAuth();
    wireTables({
      profiles: { full_name: "Test User", email: "t@x.com" },
      memberships: [membership],
    });

    const res = await request(app)
      .get("/api/v1/client-portal/bootstrap")
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
    const m = res.body.data.memberships[0];
    expect(m.subscription).toBeNull();
    expect(m.enabledModules).toContain("dashboard");
    expect(m.enabledModules).not.toContain("findings");
  });

  it("surfaces a database error as a 500", async () => {
    mockAuth();
    mockFrom.mockImplementation((table: string) =>
      table === "profiles"
        ? createMockBuilder({ data: null, error: { message: "boom" } })
        : createMockBuilder({ data: [], error: null }),
    );

    const res = await request(app)
      .get("/api/v1/client-portal/bootstrap")
      .set("Authorization", authToken);

    expect(res.status).toBe(500);
  });
});
