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
import bulkRouter from "../routes/bulk";

const authToken = "Bearer test-token";
const testOrgId = "00000000-0000-0000-0000-000000000001";

const ADMIN_MEMBER = { id: "m-1", roles: { id: "role-admin", key: "admin" } };

function mockAuthAndAdmin() {
  const supabase = {
    from: jest.fn(),
    auth: {
      admin: { createUser: jest.fn() },
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
app.use("/api/v1/bulk", bulkRouter);
app.use(errorHandler);

describe("Bulk API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("validates required fields on invite", async () => {
    const supabase = mockAuthAndAdmin();
    supabase.from.mockReturnValue(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns error for invalid email in CSV", async () => {
    const supabase = mockAuthAndAdmin();
    // requireAdmin → memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // Route handler → profiles query for existing user
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        csv: "not-an-email\n",
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.results[0].status).toBe("error");
  });

  it("returns results for valid CSV with new user", async () => {
    const supabase = mockAuthAndAdmin();
    // requireAdmin → memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // profiles query → no existing user
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));
    // auth.admin.createUser → success
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: "new-user-1" } },
      error: null,
    });
    // memberships query → no existing membership
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));
    // memberships insert → success
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { id: "m-1" }, error: null }));

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        csv: "new@example.com,New User\n",
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.results).toBeDefined();
    expect(Array.isArray(res.body.data.results)).toBe(true);
  });

  it("returns exists for existing users", async () => {
    const supabase = mockAuthAndAdmin();
    // requireAdmin → memberships query
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: [ADMIN_MEMBER], error: null }));
    // profiles query → existing user found
    supabase.from.mockReturnValueOnce(
      createMockBuilder({ data: { id: "existing-user" }, error: null }),
    );
    // memberships query → no existing membership
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: null, error: null }));
    // memberships insert → success
    supabase.from.mockReturnValueOnce(createMockBuilder({ data: { id: "m-2" }, error: null }));

    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .set("Authorization", authToken)
      .send({
        csv: "existing@example.com,Existing User\n",
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.results[0].status).toBe("exists");
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app)
      .post("/api/v1/bulk/invite")
      .send({
        csv: "test@test.com\n",
        organizationId: testOrgId,
        roleId: "00000000-0000-0000-0000-000000000020",
      });
    expect(res.status).toBe(401);
  });
});
