import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp, createMockBuilder  } from "./helpers";
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
import router from "../routes/service-catalog";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";
function mockAuth() {
  const s = {
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
  (getSupabaseAdmin as jest.Mock).mockReturnValue(s);
  return s;
}
/*
 * Route-level suite: auth/permission/subscription middleware is stubbed so
 * mocks serve route queries only. Enforcement itself is covered by the
 * dedicated middleware-*.test.ts suites.
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
const app = createTestApp();
app.use("/api/v1/service-catalog", router);
app.use(errorHandler);

describe("Service Catalog API", () => {
  beforeEach(() => jest.clearAllMocks());
  it("lists services", async () => {
    const s = mockAuth();
    s.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const r = await request(app).get("/api/v1/service-catalog").set("Authorization", authToken);
    expect(r.status).toBe(200);
  });
  it("creates a service", async () => {
    const s = mockAuth();
    s.from.mockReturnValue(
      createMockBuilder({ data: { id: "s-1", name: "Helpdesk", base_price: 25 }, error: null }),
    );
    const r = await request(app)
      .post("/api/v1/service-catalog")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, name: "Helpdesk" });
    expect(r.status).toBe(201);
  });
  it("validates required fields", async () => {
    mockAuth();
    const r = await request(app)
      .post("/api/v1/service-catalog")
      .set("Authorization", authToken)
      .send({});
    expect(r.status).toBe(400);
  });
});
