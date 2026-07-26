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
import router from "../routes/edu-automation";
const auth = "Bearer test-token";
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
  }
});
