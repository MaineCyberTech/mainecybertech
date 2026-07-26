import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest
    .fn()
    .mockReturnValue({
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
jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));

import { getSupabaseAdmin } from "../services/supabase";
import aiRouter from "../routes/ai";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";

function mockAuth() {
  const supabase = {
    from: jest.fn(),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({
          data: { user: { id: "user-1", email: "test@example.com" } },
          error: null,
        }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(supabase);
  return supabase;
}

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

    it("drafts a reply", async () => {
      const supabase = mockAuth();
      supabase.from.mockReturnValue(
        createMockBuilder({
          data: { id: "tk-1", subject: "Need help", status: "open" },
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
});
