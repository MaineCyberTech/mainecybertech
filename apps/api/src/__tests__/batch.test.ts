import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder , tableAwareFrom } from "./helpers";
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
jest.mock("../services/supabase", () => ({ getSupabaseAdmin: jest.fn(),
    getScopedClient: jest.fn((_req, _moduleKey, _kind) => require("../services/supabase").getSupabaseAdmin()) }));
jest.mock("../services/audit", () => ({ logAuditEvent: jest.fn() }));
import { getSupabaseAdmin } from "../services/supabase";
import router from "../routes/batch";

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
app.use("/api/v1/batch", router);
app.use(errorHandler);

describe("Batch API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists licenses", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 })));
    const r = await request(app).get("/api/v1/batch/licenses").set("Authorization", auth);
    expect(r.status).toBe(200);
  });
  it("creates a license", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: { id: "l-1" }, error: null })));
    const r = await request(app)
      .post("/api/v1/batch/licenses")
      .set("Authorization", auth)
      .send({ organizationId: org, vendor: "MS", productName: "365" });
    expect(r.status).toBe(201);
  });
  it("license savings", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null })));
    const r = await request(app).get("/api/v1/batch/licenses/savings").set("Authorization", auth);
    expect(r.status).toBe(200);
  });
  it("lists status items", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 })));
    const r = await request(app).get("/api/v1/batch/status").set("Authorization", auth);
    expect(r.status).toBe(200);
  });
  it("public status", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null })));
    const r = await request(app).get("/api/v1/batch/status/public").set("Authorization", auth);
    expect(r.status).toBe(200);
  });
  it("lists websites", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 })));
    const r = await request(app).get("/api/v1/batch/website-monitors").set("Authorization", auth);
    expect(r.status).toBe(200);
  });
  it("lists dmarc", async () => {
    const s = ma();
    s.from.mockImplementation(tableAwareFrom(createMockBuilder({ data: [], error: null, count: 0 })));
    const r = await request(app).get("/api/v1/batch/dmarc").set("Authorization", auth);
    expect(r.status).toBe(200);
  });
});
