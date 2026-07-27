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
import dmarcCoachRouter from "../routes/dmarc-coach";

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

const app = createTestApp();
app.use("/api/v1/dmarc-coach", dmarcCoachRouter);
app.use(errorHandler);

describe("DMARC Coach API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists dmarc analyses", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app)
      .get("/api/v1/dmarc-coach")
      .query({ organization_id: testOrgId })
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
  });

  it("creates a dmarc record", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "dmarc-1",
          domain: "example.com",
          dmarc_record: "v=DMARC1; p=none;",
          overall_grade: "C",
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/dmarc-coach")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, domain: "example.com", dmarcRecord: "v=DMARC1; p=none;" });
    expect(res.status).toBe(201);
    expect(res.body.data.domain).toBe("example.com");
  });

  it("gets a single analysis", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "dmarc-1",
          domain: "example.com",
          overall_grade: "B",
          issues: [],
          recommendations: [],
        },
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/dmarc-coach/dmarc-1")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.overall_grade).toBe("B");
  });

  it("updates a dmarc record", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "dmarc-1",
          domain: "example.com",
          dmarc_record: "v=DMARC1; p=quarantine;",
          overall_grade: "B",
        },
        error: null,
      }),
    );
    const res = await request(app)
      .patch("/api/v1/dmarc-coach/dmarc-1")
      .set("Authorization", authToken)
      .send({ dmarcRecord: "v=DMARC1; p=quarantine;" });
    expect(res.status).toBe(200);
  });

  it("deletes a dmarc record", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ error: null }));
    const res = await request(app)
      .delete("/api/v1/dmarc-coach/dmarc-1")
      .set("Authorization", authToken);
    expect(res.status).toBe(204);
  });

  it("analyze returns grade and issues", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "dmarc-2",
          domain: "example.com",
          overall_grade: "C",
          issues: JSON.stringify([]),
          recommendations: JSON.stringify([]),
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/dmarc-coach/analyze")
      .set("Authorization", authToken)
      .send({
        organizationId: testOrgId,
        domain: "example.com",
        dmarcRecord: "v=DMARC1; p=none;",
        spfRecord: "v=spf1 mx -all",
        dkimRecord: "v=DKIM1; k=rsa;",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.overall_grade).toBe("C");
  });

  it("analyze with no records returns F grade", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "dmarc-3",
          domain: "example.com",
          overall_grade: "F",
          issues: JSON.stringify([
            "No DMARC record found",
            "No SPF record found",
            "No DKIM record provided",
          ]),
          recommendations: JSON.stringify([
            "Create a DMARC record starting with 'v=DMARC1; p=none;'",
            "Create an SPF record: 'v=spf1 include:_spf.example.com ~all'",
            "Set up DKIM signing in your email provider",
          ]),
        },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/dmarc-coach/analyze")
      .set("Authorization", authToken)
      .send({
        organizationId: testOrgId,
        domain: "example.com",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.overall_grade).toBe("F");
  });

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/api/v1/dmarc-coach");
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent analysis", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({ data: null, error: { message: "Not found" } }),
    );
    const res = await request(app)
      .get("/api/v1/dmarc-coach/non-existent")
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });
});
