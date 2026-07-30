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
jest.mock("../middleware/admin", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { getSupabaseAdmin } from "../services/supabase";
import searchRouter from "../routes/search";

const authToken = "Bearer test-token";

function mockAuth() {
  const supabase = {
    from: jest.fn().mockReturnValue(createMockBuilder({ data: [], error: null })),
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
app.use("/api/v1/search", searchRouter);
app.use(errorHandler);

describe("Search API", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty results for empty query", async () => {
    mockAuth();
    const res = await request(app).get("/api/v1/search").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("users");
    expect(res.body.data).toHaveProperty("organizations");
    expect(res.body.data).toHaveProperty("tickets");
    expect(res.body.data).toHaveProperty("projects");
  });

  it("returns empty results for short query", async () => {
    mockAuth();
    const res = await request(app).get("/api/v1/search?q=a").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data.users).toEqual([]);
  });

  it("returns search results for valid query", async () => {
    const supabase = mockAuth();
    const emptyResult = { data: [], error: null };
    supabase.from.mockImplementation(() => createMockBuilder(emptyResult));
    const res = await request(app).get("/api/v1/search?q=test").set("Authorization", authToken);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("users");
    expect(res.body.data).toHaveProperty("organizations");
    expect(res.body.data).toHaveProperty("tickets");
    expect(res.body.data).toHaveProperty("projects");
    expect(res.body.data).toHaveProperty("documents");
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get("/api/v1/search?q=test");
    expect(res.status).toBe(401);
  });
});
