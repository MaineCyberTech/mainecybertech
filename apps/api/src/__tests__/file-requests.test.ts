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
import fileRequestsRouter from "../routes/file-requests";

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
app.use("/api/v1/file-requests", fileRequestsRouter);
app.use(errorHandler);

describe("File Requests API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty list", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: [], error: null, count: 0 }));
    const res = await request(app).get("/api/v1/file-requests").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  it("validates required fields on create", async () => {
    mockAuth();
    const res = await request(app)
      .post("/api/v1/file-requests")
      .set("Authorization", authToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it("creates a file request with generated token", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: { id: "fr-1", title: "Upload Bills", token: "ab" + "0".repeat(62), status: "active" },
        error: null,
      }),
    );
    const res = await request(app)
      .post("/api/v1/file-requests")
      .set("Authorization", authToken)
      .send({ organizationId: testOrgId, title: "Upload Bills" });
    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.token.length).toBeGreaterThan(10);
  });

  it("returns 404 for non-existent", async () => {
    const supabase = mockAuth();
    supabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));
    const res = await request(app)
      .get("/api/v1/file-requests/no-id")
      .set("Authorization", authToken);
    expect(res.status).toBe(404);
  });

  it("returns public info for valid token", async () => {
    const supabase = mockAuth();
    const future = new Date(Date.now() + 7 * 86400000).toISOString();
    supabase.from.mockReturnValue(
      createMockBuilder({
        data: {
          id: "fr-1",
          title: "Upload Bills",
          status: "active",
          expires_at: future,
          upload_count: 0,
          max_files: 5,
        },
        error: null,
      }),
    );
    const res = await request(app)
      .get("/api/v1/file-requests/public/test-token")
      .set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.maxFiles).toBe(5);
  });
});
