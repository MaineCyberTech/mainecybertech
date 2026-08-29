import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder , tableAwareFrom } from "./helpers";
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
jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn(),
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()) }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
import { getSupabaseAdmin } from "../services/supabase";
import router from "../routes/governance";

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

const app = createTestApp();
app.use("/api/v1/governance", router);
app.use(errorHandler);

describe("SOP Library API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists sop-library entries", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 })));
    const r = await request(app).get("/api/v1/governance/sop-library").set("Authorization", auth);
    expect(r.status).toBe(200);
  });

  it("creates an sop-library entry", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(
      createMockBuilder({
        data: { id: "sop-1", title: "Data Handling SOP", sop_category: "general" },
        error: null,
      }),
    ));
    const r = await request(app)
      .post("/api/v1/governance/sop-library")
      .set("Authorization", auth)
      .send({
        organizationId: org,
        title: "Data Handling SOP",
        sopCategory: "data_protection",
        complianceFramework: "NIST 800-53",
        frameworkControlIds: ["AC-1", "AC-2"],
      });
    expect(r.status).toBe(201);
  });

  it("gets a single sop-library entry", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(
      createMockBuilder({
        data: { id: "sop-1", title: "Data Handling SOP" },
        error: null,
      }),
    ));
    const r = await request(app)
      .get("/api/v1/governance/sop-library/sop-1")
      .set("Authorization", auth);
    expect(r.status).toBe(200);
  });

  it("updates an sop-library entry", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(
      createMockBuilder({
        data: { id: "sop-1", title: "Updated Data Handling SOP" },
        error: null,
      }),
    ));
    const r = await request(app)
      .patch("/api/v1/governance/sop-library/sop-1")
      .set("Authorization", auth)
      .send({ title: "Updated Data Handling SOP", status: "active" });
    expect(r.status).toBe(200);
  });

  it("deletes an sop-library entry", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: null, error: null })));
    const r = await request(app)
      .delete("/api/v1/governance/sop-library/sop-1")
      .set("Authorization", auth);
    expect(r.status).toBe(204);
  });

  it("returns compliance map", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(
      createMockBuilder({
        data: [
          {
            compliance_framework: "NIST 800-53",
            framework_control_ids: ["AC-1", "AC-2"],
            status: "active",
          },
          { compliance_framework: "NIST 800-53", framework_control_ids: ["AC-1"], status: "draft" },
          { compliance_framework: null, framework_control_ids: [], status: "active" },
        ],
        error: null,
      }),
    ));
    const r = await request(app)
      .get("/api/v1/governance/sop-library/compliance-map?organization_id=org-1")
      .set("Authorization", auth);
    expect(r.status).toBe(200);
    expect(r.body.data.frameworks).toBeDefined();
    expect(r.body.data.totalSops).toBe(3);
  });

  it("returns 401 without auth token", async () => {
    const r = await request(app).get("/api/v1/governance/sop-library");
    expect(r.status).toBe(401);
  });

  it("returns 404 for missing sop entry", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: null, error: { message: "Not found" } })));
    const r = await request(app)
      .get("/api/v1/governance/sop-library/missing-id")
      .set("Authorization", auth);
    expect(r.status).toBe(404);
  });
});
