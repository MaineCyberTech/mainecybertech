import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder, createOrgAccessStub } from "./helpers";
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
    SMTP_PORT: 587,
    SMTP_USER: "",
    SMTP_PASS: "",
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

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import complianceRouter from "../routes/compliance";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";

function mockAuth() {
  const supabase = {
    from: jest.fn(),
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

/*
 * Route-level suite: auth/permission/subscription middleware is stubbed so
 * mocks serve route queries only. Enforcement itself is covered by the
 * dedicated middleware-*.test.ts suites.
 */
jest.mock("../middleware/org-access", () =>
  createOrgAccessStub("00000000-0000-0000-0000-000000000001"),
);
jest.mock("../middleware/permissions", () => ({
  requirePermission:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));
const app = createTestApp();
app.use("/api/v1/compliance", complianceRouter);
app.use(errorHandler);

describe("Compliance API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/compliance/frameworks", () => {
    it("returns frameworks list", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: [
            {
              id: "f1",
              organization_id: testOrgId,
              name: "SOC 2",
              description: null,
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
          error: null,
        }),
      );

      const res = await request(app)
        .get(`/api/v1/compliance/frameworks?organization_id=${testOrgId}`)
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].name).toBe("SOC 2");
    });
  });

  describe("POST /api/v1/compliance/frameworks", () => {
    it("validates required fields", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/compliance/frameworks")
        .set("Authorization", authToken)
        .send({});
      expect(res.status).toBe(400);
    });

    it("creates a framework", async () => {
      const supabase = mockAuth();
      const created = {
        id: "f1",
        organization_id: testOrgId,
        name: "SOC 2",
        description: "Security framework",
        created_at: "2026-01-01T00:00:00Z",
      };
      supabase.from.mockReturnValue(createMockBuilder({ data: created, error: null }));

      const res = await request(app)
        .post("/api/v1/compliance/frameworks")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId, name: "SOC 2", description: "Security framework" });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("SOC 2");
    });
  });

  describe("GET /api/v1/compliance/frameworks/:id/controls", () => {
    it("returns controls for a framework", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: [
            {
              id: "c1",
              framework_id: "f1",
              organization_id: testOrgId,
              title: "Access Control",
              status: "implemented",
              owner: "Alice",
              due_at: null,
              notes: null,
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
          error: null,
        }),
      );

      const res = await request(app)
        .get(`/api/v1/compliance/frameworks/f1/controls?organization_id=${testOrgId}`)
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
      expect(res.body.data[0].title).toBe("Access Control");
    });
  });

  describe("POST /api/v1/compliance/frameworks/:id/controls", () => {
    it("creates a control", async () => {
      const supabase = mockAuth();
      const created = {
        id: "c1",
        framework_id: "f1",
        organization_id: testOrgId,
        title: "Access Control",
        status: "not_started",
        owner: null,
        due_at: null,
        notes: null,
        created_at: "2026-01-01T00:00:00Z",
      };
      supabase.from.mockReturnValue(createMockBuilder({ data: created, error: null }));

      const res = await request(app)
        .post("/api/v1/compliance/frameworks/f1/controls")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId, title: "Access Control" });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Access Control");
    });
  });

  describe("PATCH /api/v1/compliance/controls/:id", () => {
    it("updates a control", async () => {
      const supabase = mockAuth();
      const updated = {
        id: "c1",
        framework_id: "f1",
        organization_id: testOrgId,
        title: "Access Control",
        status: "implemented",
        owner: "Bob",
        due_at: null,
        notes: null,
        created_at: "2026-01-01T00:00:00Z",
      };
      supabase.from.mockReturnValue(createMockBuilder({ data: updated, error: null }));

      const res = await request(app)
        .patch("/api/v1/compliance/controls/c1?organization_id=" + testOrgId)
        .set("Authorization", authToken)
        .send({ status: "implemented", owner: "Bob" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("implemented");
    });
  });

  describe("DELETE /api/v1/compliance/controls/:id", () => {
    it("deletes a control", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { id: "c1", organization_id: testOrgId },
          error: null,
        }),
      );

      const res = await request(app)
        .delete("/api/v1/compliance/controls/c1?organization_id=" + testOrgId)
        .set("Authorization", authToken);

      expect(res.status).toBe(204);
    });
  });

  describe("Tenant isolation (QW-1)", () => {
    const ORG_A = "00000000-0000-0000-0000-000000000001";
    const ORG_B = "00000000-0000-0000-0000-000000000002";
    const CONTROL_ID = "00000000-0000-0000-0000-0000000000c2";

    function mockControl(orgId: string, extra: Record<string, unknown> = {}) {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { id: CONTROL_ID, framework_id: "f1", organization_id: orgId, title: "Access Control", status: "implemented", owner: "Bob", due_at: null, notes: null, ...extra },
          error: null,
        }),
      );
      return supabase;
    }

    it("PATCH /controls/:id returns 404 when the control is in another org", async () => {
      mockControl(ORG_B);
      const res = await request(app)
        .patch(`/api/v1/compliance/controls/${CONTROL_ID}?organization_id=${ORG_A}`)
        .set("Authorization", authToken)
        .send({ status: "implemented", owner: "Bob" });
      expect(res.status).toBe(404);
    });

    it("DELETE /controls/:id returns 404 when the control is in another org", async () => {
      mockControl(ORG_B);
      const res = await request(app)
        .delete(`/api/v1/compliance/controls/${CONTROL_ID}?organization_id=${ORG_A}`)
        .set("Authorization", authToken);
      expect(res.status).toBe(404);
    });

    it("PATCH /controls/:id succeeds when the control belongs to the caller's org", async () => {
      mockControl(ORG_A);
      const res = await request(app)
        .patch(`/api/v1/compliance/controls/${CONTROL_ID}?organization_id=${ORG_A}`)
        .set("Authorization", authToken)
        .send({ status: "implemented", owner: "Bob" });
      expect(res.status).toBe(200);
    });
  });
});
