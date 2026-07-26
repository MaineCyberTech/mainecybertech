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
import router from "../routes/security-suite";

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
app.use("/api/v1/security-suite", router);
app.use(errorHandler);

describe("Security Suite API", () => {
  beforeEach(() => jest.clearAllMocks());
  it("lists m365", async () => {
    const s = ma();
    s.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const r = await request(app)
      .get("/api/v1/security-suite/m365-hardening")
      .set("Authorization", auth);
    expect(r.status).toBe(200);
  });
  it("lists incidents", async () => {
    const s = ma();
    s.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const r = await request(app).get("/api/v1/security-suite/incidents").set("Authorization", auth);
    expect(r.status).toBe(200);
  });
  it("lists id verification", async () => {
    const s = ma();
    s.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const r = await request(app)
      .get("/api/v1/security-suite/identity-verification")
      .set("Authorization", auth);
    expect(r.status).toBe(200);
  });
  it("lists endpoints", async () => {
    const s = ma();
    s.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const r = await request(app)
      .get("/api/v1/security-suite/endpoint-security")
      .set("Authorization", auth);
    expect(r.status).toBe(200);
  });
  it("creates incident", async () => {
    const s = ma();
    s.from.mockReturnValue(createMockBuilder({ data: { id: "i-1", title: "Test" }, error: null }));
    const r = await request(app)
      .post("/api/v1/security-suite/incidents")
      .set("Authorization", auth)
      .send({ organizationId: org, incidentType: "phishing", title: "Phishing Attempt" });
    expect(r.status).toBe(201);
  });
});
