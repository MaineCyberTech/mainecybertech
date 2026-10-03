import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, tableAwareFrom } from "./helpers";
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

jest.mock("../services/supabase", () => {
  const getSupabaseAdmin = jest.fn();
  return {
    getSupabaseAdmin,
    getScopedClient: jest.fn((_req: unknown, _moduleKey: string, _kind?: string) =>
      getSupabaseAdmin(),
    ),
  };
});
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("../middleware/permissions", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import statusPageRouter from "../routes/status-page";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";

function mockAuth() {
  const supabase = {
    from: jest
      .fn()
      .mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 }))),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
    rpc: jest.fn().mockResolvedValue({ data: { has_access: true }, error: null }),
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

const app = createTestApp();
app.use("/api/v1/status-page", statusPageRouter);
app.use(errorHandler);

describe("Status Page API", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("GET /api/v1/status-page/public/:orgId", () => {
    /** Mock an org whose status page is explicitly enabled (or not). */
    const orgWith = (enabled: boolean) =>
      createMockBuilder({
        data: { settings: { status_page_enabled: enabled } },
        error: null,
      });

    it("returns public status when the org has enabled its status page", async () => {
      const supabase = mockAuth();
      let first = true;
      supabase.from.mockImplementation((table: string) => {
        // The gate reads `organizations` first; everything after is status data.
        if (first && table === "organizations") {
          first = false;
          return orgWith(true);
        }
        if (table === "status_components")
          return createMockBuilder({ data: [{ id: "c1", name: "API" }], error: null });
        return createMockBuilder({ data: [], error: null });
      });
      const res = await request(app).get(`/api/v1/status-page/public/${testOrgId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.components).toHaveLength(1);
      expect(res.body.data.activeIncidents).toEqual([]);
      expect(res.body.data.upcomingMaintenance).toEqual([]);
    });

    it("404s when the status page is NOT enabled - no anonymous enumeration", async () => {
      const supabase = mockAuth();
      supabase.from.mockImplementation((table: string) => {
        if (table === "organizations") return orgWith(false);
        return createMockBuilder({ data: [], error: null });
      });
      const res = await request(app).get(`/api/v1/status-page/public/${testOrgId}`);
      expect(res.status).toBe(404);
    });

    it("404s identically for an unknown org (cannot confirm an org exists)", async () => {
      const supabase = mockAuth();
      supabase.from.mockImplementation((table: string) => {
        if (table === "organizations")
          return createMockBuilder({ data: null, error: null });
        return createMockBuilder({ data: [], error: null });
      });
      const res = await request(app).get(`/api/v1/status-page/public/${testOrgId}`);
      expect(res.status).toBe(404);
    });

    it("fails CLOSED on a DB error rather than serving the page", async () => {
      const supabase = mockAuth();
      supabase.from.mockImplementation((table: string) => {
        if (table === "organizations")
          return createMockBuilder({ data: null, error: new Error("db down") });
        return createMockBuilder({ data: [], error: null });
      });
      const res = await request(app).get(`/api/v1/status-page/public/${testOrgId}`);
      expect(res.status).toBe(404);
    });

    it("fails CLOSED when settings exist but carry no status_page_enabled flag", async () => {
      const supabase = mockAuth();
      supabase.from.mockImplementation((table: string) => {
        if (table === "organizations")
          return createMockBuilder({ data: { settings: {} }, error: null });
        return createMockBuilder({ data: [], error: null });
      });
      const res = await request(app).get(`/api/v1/status-page/public/${testOrgId}`);
      expect(res.status).toBe(404);
    });

    it("includes active incidents", async () => {
      const supabase = mockAuth();
      let first = true;
      supabase.from.mockImplementation((table: string) => {
        if (first && table === "organizations") {
          first = false;
          return orgWith(true);
        }
        if (table === "status_components") return createMockBuilder({ data: [], error: null });
        if (table === "status_incidents")
          return createMockBuilder({ data: [{ id: "i1", title: "Outage" }], error: null });
        return createMockBuilder({ data: [], error: null });
      });
      const res = await request(app).get(`/api/v1/status-page/public/${testOrgId}`);
      expect(res.body.data.activeIncidents).toHaveLength(1);
    });

    it("projects an explicit public allowlist (no internal attribution columns)", async () => {
      const supabase = mockAuth();
      const builders: Record<string, ReturnType<typeof createMockBuilder>> = {};
      let first = true;
      supabase.from.mockImplementation((table: string) => {
        if (first && table === "organizations") {
          first = false;
          return orgWith(true);
        }
        const builder = createMockBuilder({ data: [], error: null });
        builders[table] = builder;
        return builder;
      });

      await request(app).get(`/api/v1/status-page/public/${testOrgId}`);

      const componentCols = builders.status_components.select.mock.calls[0][0] as string;
      const incidentCols = builders.status_incidents.select.mock.calls[0][0] as string;
      const maintenanceCols = builders.maintenance_notices.select.mock.calls[0][0] as string;

      expect(componentCols).not.toBe("*");
      expect(componentCols).not.toContain("created_by");
      expect(componentCols).not.toContain("organization_id");
      expect(incidentCols).not.toContain("created_by");
      expect(incidentCols).not.toContain("organization_id");
      expect(maintenanceCols).not.toContain("created_by");
      expect(maintenanceCols).not.toContain("organization_id");

      // And it still filters to the requested org (enumeration is by opaque id).
      expect(builders.status_components.eq).toHaveBeenCalledWith(
        "organization_id",
        testOrgId,
      );
    });
  });

  describe("GET /api/v1/status-page/components", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/v1/status-page/components");
      expect(res.status).toBe(401);
    });

    it("lists components", async () => {
      mockAuth();
      const res = await request(app)
        .get(`/api/v1/status-page/components?organization_id=${testOrgId}`)
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("items");
    });
  });

  describe("POST /api/v1/status-page/components", () => {
    it("creates a component", async () => {
      const supabase = mockAuth();
      supabase.from.mockImplementation(
        tableAwareFrom(
          createMockBuilder({
            data: { id: "c1", name: "API", status: "operational" },
            error: null,
          }),
        ),
      );
      const res = await request(app)
        .post("/api/v1/status-page/components")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId, name: "API" });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("API");
    });

    it("validates required fields", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/status-page/components")
        .set("Authorization", authToken)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/status-page/components/:id", () => {
    it("returns 404 for missing component", async () => {
      const supabase = mockAuth();
      supabase.from.mockImplementation(
        tableAwareFrom(createMockBuilder({ data: null, error: null })),
      );
      const res = await request(app)
        .get("/api/v1/status-page/components/missing-id")
        .set("Authorization", authToken);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/status-page/incidents", () => {
    it("lists incidents", async () => {
      mockAuth();
      const res = await request(app)
        .get(`/api/v1/status-page/incidents?organization_id=${testOrgId}`)
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("items");
    });
  });

  describe("POST /api/v1/status-page/incidents", () => {
    it("creates an incident", async () => {
      const supabase = mockAuth();
      supabase.from.mockImplementation(
        tableAwareFrom(
          createMockBuilder({
            data: { id: "i1", title: "Outage", severity: "major" },
            error: null,
          }),
        ),
      );
      const res = await request(app)
        .post("/api/v1/status-page/incidents")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId, title: "Outage" });
      expect(res.status).toBe(201);
    });
  });

  describe("GET /api/v1/status-page/maintenance", () => {
    it("lists maintenance notices", async () => {
      mockAuth();
      const res = await request(app)
        .get(`/api/v1/status-page/maintenance?organization_id=${testOrgId}`)
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("items");
    });
  });

  describe("POST /api/v1/status-page/maintenance", () => {
    it("creates a maintenance notice", async () => {
      const supabase = mockAuth();
      supabase.from.mockImplementation(
        tableAwareFrom(
          createMockBuilder({ data: { id: "m1", title: "Scheduled Upgrade" }, error: null }),
        ),
      );
      const res = await request(app)
        .post("/api/v1/status-page/maintenance")
        .set("Authorization", authToken)
        .send({
          organizationId: testOrgId,
          title: "Scheduled Upgrade",
          scheduledStart: new Date().toISOString(),
          scheduledEnd: new Date(Date.now() + 3600000).toISOString(),
        });
      expect(res.status).toBe(201);
    });

    it("validates required fields", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/status-page/maintenance")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId, title: "Maintenance" });
      expect(res.status).toBe(400);
    });
  });
});
