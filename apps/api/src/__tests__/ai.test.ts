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
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
}));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import aiRouter from "../routes/ai";

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
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
const app = createTestApp();
app.use("/api/v1/ai", aiRouter);
app.use(errorHandler);

describe("AI API", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Triage", () => {
    it("analyzes a description and returns suggestions", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: {
            id: "t-1",
            suggested_category: "hardware",
            suggested_priority: "high",
            confidence_score: 80,
          },
          error: null,
        }),
      );
      const res = await request(app)
        .post("/api/v1/ai/triage/analyze")
        .set("Authorization", authToken)
        .send({
          organizationId: testOrgId,
          rawDescription: "My laptop wont turn on and I have a deadline tomorrow morning",
        });
      expect(res.status).toBe(201);
      expect(res.body.data.suggested_category).toBe("hardware");
      expect(res.body.data.confidence_score).toBeGreaterThan(50);
    });

    it("validates minimum description length", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/ai/triage/analyze")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId, rawDescription: "short" });
      expect(res.status).toBe(400);
    });

    it("lists triage drafts", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
      const res = await request(app).get("/api/v1/ai/triage").set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });
  });

  describe("Copilot", () => {
    it("summarizes a ticket", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: {
            id: "tk-1",
            subject: "Test",
            status: "open",
            priority: "normal",
            category: "hardware",
            created_at: new Date().toISOString(),
            organization_id: testOrgId,
          },
          error: null,
        }),
      );
      const res = await request(app)
        .get("/api/v1/ai/copilot/tk-1/summarize")
        .set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("suggestedNextAction");
    });

    it("returns 404 when summarizing a ticket from another org", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: {
            id: "tk-1",
            subject: "Test",
            status: "open",
            priority: "normal",
            category: "hardware",
            created_at: new Date().toISOString(),
            organization_id: "00000000-0000-0000-0000-000000000002",
          },
          error: null,
        }),
      );
      const res = await request(app)
        .get("/api/v1/ai/copilot/tk-1/summarize")
        .set("Authorization", authToken);
      expect(res.status).toBe(404);
    });

    it("drafts a reply", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: {
            id: "tk-1",
            subject: "Need help",
            title: "Need help",
            status: "open",
            organization_id: testOrgId,
          },
          error: null,
        }),
      );
      const res = await request(app)
        .post("/api/v1/ai/copilot/tk-1/reply-draft")
        .set("Authorization", authToken)
        .send({ organizationId: testOrgId, tone: "friendly" });
      expect(res.status).toBe(200);
      expect(res.body.data.draftReply).toContain("Hi there");
    });
  });

  describe("AI draft review gate (FEAT-P2-004)", () => {
    it("persists a draft with status 'draft'", async () => {
      const supabase = mockAuth();
      const builder = createMockBuilder({
        data: { id: "draft-1", status: "draft", module_key: "compliance-readiness" },
        error: null,
      });
      supabase.from.mockReturnValue(builder);

      const res = await request(app)
        .post("/api/v1/ai/drafts")
        .set("Authorization", authToken)
        .send({
          organizationId: testOrgId,
          moduleKey: "compliance-readiness",
          promptKey: "compliance/interpret-control",
          draftContent: { summary: "Draft interpretation" },
        });

      expect(res.status).toBe(201);
      expect(builder.insert).toHaveBeenCalled();
      expect(res.body.data.status).toBe("draft");
    });

    it("validates the draft payload", async () => {
      mockAuth();
      const res = await request(app)
        .post("/api/v1/ai/drafts")
        .set("Authorization", authToken)
        .send({});
      expect(res.status).toBe(400);
    });

    it("lists drafts with paging metadata", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
      const res = await request(app).get("/api/v1/ai/drafts").set("Authorization", authToken);
      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.total).toBe(0);
    });

    it("approves a draft and records the reviewer", async () => {
      const supabase = mockAuth();
      let calls = 0;
      supabase.from.mockImplementation(() => {
        calls += 1;
        return createMockBuilder(
          calls === 1
            ? {
                data: {
                  id: "draft-1",
                  status: "draft",
                  module_key: "compliance-readiness",
                  draft_content: { summary: "Draft interpretation" },
                },
                error: null,
              }
            : { data: { id: "draft-1", status: "approved" }, error: null },
        );
      });

      const res = await request(app)
        .post("/api/v1/ai/drafts/draft-1/review")
        .set("Authorization", authToken)
        .send({ decision: "approved", reviewNotes: "looks good" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("approved");
    });

    it("refuses to re-review an output that is no longer a draft", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { id: "draft-1", status: "approved", module_key: "compliance-readiness" },
          error: null,
        }),
      );
      const res = await request(app)
        .post("/api/v1/ai/drafts/draft-1/review")
        .set("Authorization", authToken)
        .send({ decision: "rejected" });
      expect(res.status).toBe(409);
    });
  });
});
