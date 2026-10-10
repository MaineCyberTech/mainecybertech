import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, tableAwareFrom } from "./helpers";
import { errorHandler } from "../middleware/error";
import { logAuditEvent } from "../services/audit";

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
jest.mock("../lib/metrics", () => ({ recordSearchQuery: jest.fn() }));
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/org-access", () => {
  const { createOrgAccessStub } = require("./helpers");
  return createOrgAccessStub("00000000-0000-0000-0000-00000000000a");
});

import { getSupabaseAdmin } from "../services/supabase";
import searchRouter from "../routes/search";

const authToken = "Bearer test-token";

function mockAuth() {
  const supabase = {
    from: jest.fn().mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null }))),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/search", searchRouter);
app.use(errorHandler);

describe("Search API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty results for empty query", async () => {
    mockAuth();
    const res = await request(app).get("/api/v1/search").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("users");
    expect(res.body.data).toHaveProperty("organizations");
    expect(res.body.data).toHaveProperty("tickets");
    expect(res.body.data).toHaveProperty("projects");
  });

  it("returns empty results for short query", async () => {
    mockAuth();
    const res = await request(app).get("/api/v1/search?q=a").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.users).toEqual([]);
  });

  it("returns search results for valid query", async () => {
    const supabase = mockAuth();
    const emptyResult = { data: [], error: null };
    supabase.from.mockImplementation(tableAwareFrom(createMockBuilder(emptyResult)));
    const res = await request(app).get("/api/v1/search?q=test").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("users");
    expect(res.body.data).toHaveProperty("organizations");
    expect(res.body.data).toHaveProperty("tickets");
    expect(res.body.data).toHaveProperty("projects");
    expect(res.body.data).toHaveProperty("documents");
    // IR-P2-001: the search counter is wired.
    const { recordSearchQuery } = jest.requireMock("../lib/metrics") as {
      recordSearchQuery: jest.Mock;
    };
    expect(recordSearchQuery).toHaveBeenCalled();
  });

  it("honors ?limit and returns per-entity counts [SEARCH-P2-004]", async () => {
    const supabase = mockAuth();
    const builder = createMockBuilder({ data: [], error: null, count: 7 });
    // Every table resolves through the same builder so the five entity queries
    // (and the membership/profile lookups they depend on) see the count.
    supabase.from.mockReturnValue(builder);

    const res = await request(app)
      .get("/api/v1/search?q=test&limit=10")
      .set("Authorization", authToken);

    expect(res.status).toBe(200);
    expect(res.body.data.limit).toBe(10);
    expect(res.body.data.counts).toEqual({
      users: 7,
      organizations: 7,
      tickets: 7,
      projects: 7,
      documents: 7,
    });
    expect(builder.limit).toHaveBeenCalledWith(10);
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get("/api/v1/search?q=test");
    expect(res.status).toBe(401);
  });

  describe("tenant scoping and PII (SEARCH-P1-002)", () => {
    const ORG_A = "00000000-0000-0000-0000-00000000000a";
    const ORG_B = "00000000-0000-0000-0000-00000000000b";

    /**
     * Mock a plain per-tenant `admin` (cross-tenant role key but NOT a
     * super_admin profile). Records every builder created per table so the
     * test can assert the generated query shape.
     */
    function mockTenantAdmin() {
      const builders: Record<string, any[]> = {};
      const supabase = {
        from: jest.fn((table: string) => {
          const rowsFor = (): unknown => {
            if (table === "profiles") return { is_super_admin: false };
            if (table === "memberships") {
              // First membership call resolves the caller's orgs/roles (with
              // the embedded roles key); subsequent calls resolve member ids.
              return (builders.memberships?.length ?? 0) === 0
                ? [{ organization_id: ORG_A, roles: [{ id: "r1", key: "admin" }] }]
                : [{ user_id: "user-1" }];
            }
            return [];
          };
          const builder = createMockBuilder({ data: rowsFor(), error: null });
          (builders[table] ??= []).push(builder);
          return builder;
        }),
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-1", email: "admin@example.com" } },
            error: null,
          }),
        },
      };
      (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
      return { supabase, builders };
    }

    it("scopes the organizations query to the caller's own orgs", async () => {
      const { builders } = mockTenantAdmin();

      const res = await request(app)
        .get("/api/v1/search?q=acme")
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
      const orgBuilder = builders.organizations?.[0];
      expect(orgBuilder).toBeDefined();
      expect(orgBuilder.in).toHaveBeenCalledWith("id", [ORG_A]);
      expect(orgBuilder.in).not.toHaveBeenCalledWith("id", expect.arrayContaining([ORG_B]));
    });

    it("reduces profile PII for a non-super_admin caller", async () => {
      const { builders } = mockTenantAdmin();

      const res = await request(app)
        .get("/api/v1/search?q=acme")
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
      const profileBuilder = builders.profiles?.find(
        (b) => b.select.mock.calls[0]?.[0] !== "is_super_admin",
      );
      expect(profileBuilder).toBeDefined();
      const projection = profileBuilder!.select.mock.calls[0][0];
      expect(projection).toBe("id, full_name, title");
      expect(projection).not.toContain("email");
      expect(projection).not.toContain("phone");
    });

    it("does not persist the raw search term in audit metadata", async () => {
      mockTenantAdmin();

      const res = await request(app)
        .get("/api/v1/search?q=customer@example.com")
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
      expect(logAuditEvent).toHaveBeenCalledTimes(1);
      const call = (logAuditEvent as jest.Mock).mock.calls[0][0] as {
        metadata: Record<string, unknown>;
      };
      expect(call.metadata).not.toHaveProperty("query");
      expect(JSON.stringify(call.metadata)).not.toContain("customer@example.com");
      expect(typeof call.metadata.queryHash).toBe("string");
      expect(call.metadata.queryLength).toBe("customer@example.com".length);
    });
  });
});
