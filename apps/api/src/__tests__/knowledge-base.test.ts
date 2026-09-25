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

jest.mock("../services/supabase", () => {
  const getSupabaseAdmin = jest.fn();
  return {
    getSupabaseAdmin,
    // Delegates to the admin client unless the RLS allow-list is enabled in a
    // test (it isn't here), mirroring the default production fallback.
    getScopedClient: jest.fn((_req: unknown, _moduleKey: string, _kind?: string) =>
      getSupabaseAdmin(),
    ),
  };
});

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import knowledgeBaseRouter from "../routes/knowledge-base";

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
app.use("/api/v1/knowledge-base", knowledgeBaseRouter);
app.use(errorHandler);

describe("Knowledge Base API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/knowledge-base", () => {
    it("returns empty paginated list", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));

      const res = await request(app).get("/api/v1/knowledge-base").set("Authorization", authToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("items");
      expect(res.body.data).toHaveProperty("total");
    });

    it("supports search query param", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));

      const res = await request(app)
        .get("/api/v1/knowledge-base?search=vpn")
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
    });

    it("supports category query param", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));

      const res = await request(app)
        .get("/api/v1/knowledge-base?category=security")
        .set("Authorization", authToken);

      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/v1/knowledge-base", () => {
    it("validates required fields with empty body", async () => {
      mockAuth();

      const res = await request(app)
        .post("/api/v1/knowledge-base")
        .set("Authorization", authToken)
        .send({});

      expect(res.status).toBe(400);
    });

    it("creates an article successfully", async () => {
      const supabase = mockAuth();
      const insertResult = {
        id: "00000000-0000-0000-0000-000000000010",
        organization_id: testOrgId,
        title: "Password Policy",
        body: "Use strong passwords.",
        category: "security",
        tags: [],
        is_published: true,
        created_by: "user-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      supabase.from.mockReturnValue(createMockBuilder({ data: insertResult, error: null }));

      const res = await request(app)
        .post("/api/v1/knowledge-base")
        .set("Authorization", authToken)
        .send({
          organizationId: testOrgId,
          title: "Password Policy",
          body: "Use strong passwords.",
          category: "security",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Password Policy");
    });
  });

  describe("GET /api/v1/knowledge-base/:id", () => {
    it("returns 404 for non-existent article", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

      const res = await request(app)
        .get("/api/v1/knowledge-base/00000000-0000-0000-0000-000000000099")
        .set("Authorization", authToken);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/v1/knowledge-base/:id", () => {
    it("updates an article", async () => {
      const supabase = mockAuth();
      const updated = {
        id: "00000000-0000-0000-0000-000000000010",
        organization_id: testOrgId,
        title: "Updated Title",
        body: "Updated body.",
        category: "security",
        tags: [],
        is_published: true,
        created_by: "user-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      supabase.from.mockReturnValue(createMockBuilder({ data: updated, error: null }));

      const res = await request(app)
        .patch("/api/v1/knowledge-base/00000000-0000-0000-0000-000000000010")
        .set("Authorization", authToken)
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Title");
    });
  });

  describe("DELETE /api/v1/knowledge-base/:id", () => {
    it("deletes an article", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { id: "00000000-0000-0000-0000-000000000010", organization_id: testOrgId },
          error: null,
        }),
      );

      const res = await request(app)
        .delete("/api/v1/knowledge-base/00000000-0000-0000-0000-000000000010")
        .set("Authorization", authToken);

      expect(res.status).toBe(204);
    });
  });

  describe("Tenant isolation (QW-1)", () => {
    const ORG_A = "00000000-0000-0000-0000-000000000001";
    const ORG_B = "00000000-0000-0000-0000-000000000002";
    const ARTICLE_ID = "00000000-0000-0000-0000-0000000000kb";

    function mockArticle(orgId: string) {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { id: ARTICLE_ID, organization_id: orgId, title: "Article", body: "b", category: "security", tags: [], is_published: true },
          error: null,
        }),
      );
      return supabase;
    }

    it("GET /:id returns 404 when the article is in another org", async () => {
      mockArticle(ORG_B);
      const res = await request(app)
        .get(`/api/v1/knowledge-base/${ARTICLE_ID}`)
        .set("Authorization", authToken);
      expect(res.status).toBe(404);
    });

    it("PATCH /:id returns 404 when the article is in another org", async () => {
      mockArticle(ORG_B);
      const res = await request(app)
        .patch(`/api/v1/knowledge-base/${ARTICLE_ID}`)
        .set("Authorization", authToken)
        .send({ title: "Renamed" });
      expect(res.status).toBe(404);
    });

    it("DELETE /:id returns 404 when the article is in another org", async () => {
      mockArticle(ORG_B);
      const res = await request(app)
        .delete(`/api/v1/knowledge-base/${ARTICLE_ID}`)
        .set("Authorization", authToken);
      expect(res.status).toBe(404);
    });

    it("PATCH /:id succeeds when the article belongs to the caller's org", async () => {
      mockArticle(ORG_A);
      const res = await request(app)
        .patch(`/api/v1/knowledge-base/${ARTICLE_ID}`)
        .set("Authorization", authToken)
        .send({ title: "Renamed" });
      expect(res.status).toBe(200);
    });
  });
});
