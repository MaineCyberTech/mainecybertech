import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder  } from "./helpers";
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
import router from "../routes/edu-automation";

const auth = "Bearer test-token";
const org = "00000000-0000-0000-0000-000000000001";

function ma() {
  const s = {
    from: jest.fn(),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: "u", email: "t" } }, error: null }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(s);
  return s;
}

/*
 * Route-level suites: auth/permission middleware is stubbed so the shared
 * Supabase mock serves only route queries. Middleware enforcement itself is
 * covered by security-suite / edge-cases / dedicated middleware tests.
 */
jest.mock("../middleware/org-access", () => ({
  requireOrgAccess: (_req: unknown, _res: unknown, next: () => void) => next(),
  requireOrgAccessByParam: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock("../middleware/permissions", () => ({
  requirePermission:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
}));
jest.mock("../middleware/require-active-subscription", () => ({
  requireActiveSubscription: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const app = createTestApp();
app.use("/api/v1/edu-automation", router);
app.use(errorHandler);

describe("Edu Automation API", () => {
  beforeEach(() => jest.clearAllMocks());

  const paths = [
    "sop",
    "compliance",
    "insurance",
    "ai-policy",
    "kb",
    "training",
    "phishing",
    "scorecards",
    "automation",
    "powershell",
    "kb-generator",
  ];

  for (const p of paths) {
    it(`lists ${p}`, async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
      const r = await request(app).get(`/api/v1/edu-automation/${p}`).set("Authorization", auth);
      expect(r.status).toBe(200);
    });
    it(`gets ${p} by id`, async () => {
      const s = ma();
      s.from.mockReturnValue(createMockBuilder({ data: { id: "rec-1" }, error: null }));
      const r = await request(app)
        .get(`/api/v1/edu-automation/${p}/rec-1`)
        .set("Authorization", auth);
      expect(r.status).toBe(200);
      expect(r.body.success).toBe(true);
    });
  }

  it("creates a sop item", async () => {
    const s = ma();
    s.from.mockReturnValue(
      createMockBuilder({ data: { id: "sop-1", title: "Onboarding SOP" }, error: null }),
    );
    const r = await request(app)
      .post("/api/v1/edu-automation/sop")
      .set("Authorization", auth)
      .send({ organizationId: org, title: "Onboarding SOP", content: "Step 1..." });
    expect(r.status).toBe(201);
  });

  it("updates a sop item", async () => {
    const s = ma();
    s.from.mockReturnValue(
      createMockBuilder({ data: { id: "sop-1", title: "Updated SOP" }, error: null }),
    );
    const r = await request(app)
      .patch("/api/v1/edu-automation/sop/sop-1")
      .set("Authorization", auth)
      .send({ title: "Updated SOP" });
    expect(r.status).toBe(200);
  });

  it("returns 404 when updating nonexistent sop", async () => {
    const s = ma();
    s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const r = await request(app)
      .patch("/api/v1/edu-automation/sop/missing-id")
      .set("Authorization", auth)
      .send({ title: "Updated" });
    expect(r.status).toBe(404);
  });

  it("deletes a sop item", async () => {
    const s = ma();
    s.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const r = await request(app)
      .delete("/api/v1/edu-automation/sop/sop-1")
      .set("Authorization", auth);
    expect(r.status).toBe(204);
  });

  it("creates a training module", async () => {
    const s = ma();
    s.from.mockReturnValue(
      createMockBuilder({ data: { id: "tr-1", title: "Security 101" }, error: null }),
    );
    const r = await request(app)
      .post("/api/v1/edu-automation/training")
      .set("Authorization", auth)
      .send({ organizationId: org, title: "Security 101", description: "Basic training" });
    expect(r.status).toBe(201);
  });

  it("validates request body on create", async () => {
    ma();
    const r = await request(app)
      .post("/api/v1/edu-automation/sop")
      .set("Authorization", auth)
      .send({});
    expect(r.status).toBe(400);
  });

  it("returns 401 without auth token", async () => {
    const r = await request(app).get("/api/v1/edu-automation/sop");
    expect(r.status).toBe(401);
  });

  it("generates a KB article draft into generated_content", async () => {
    const s = ma();
    s.from
      .mockReturnValueOnce(
        createMockBuilder({
          data: { id: "kg-1", source_title: "Password Reset Runbook", status: "draft" },
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createMockBuilder({
          data: {
            id: "kg-1",
            generated_content: "# Password Reset Runbook",
            status: "generated",
          },
          error: null,
        }),
      );
    const r = await request(app)
      .post("/api/v1/edu-automation/kb-generator/kg-1/generate")
      .set("Authorization", auth);
    expect(r.status).toBe(200);
    expect(r.body.data.generated_content).toContain("# Password Reset Runbook");
    expect(r.body.data.status).toBe("generated");
  });
});
