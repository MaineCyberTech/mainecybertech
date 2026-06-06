import { jest } from "@jest/globals";
import request from "supertest";
import authRouter from "../routes/auth";
import { createTestApp, createMockBuilder, type MockResult } from "./helpers";
import { errorHandler } from "../middleware/error";

jest.mock("../config/env", () => ({
  getEnv: jest.fn().mockReturnValue({
    NODE_ENV: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    CORS_ORIGIN: "*",
    LOG_LEVEL: "silent",
    API_PORT: 4000,
  }),
}));

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
  
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin } from "../services/supabase";

const app = createTestApp();
app.use("/api/v1/auth", authRouter);
app.use(errorHandler);

function mockSupabase() {
  const mock = {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          session: { access_token: "token-123" },
          user: { id: "user-1", email: "test@example.com" },
        },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      }),
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);
  return mock;
}

describe("POST /sign-in", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with access token", async () => {
    const supabase = mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/sign-in")
      .send({ email: "a@b.com", password: "secret" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe("token-123");
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secret",
    });
  });

  it("returns 400 when email missing", async () => {
    mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/sign-in")
      .send({ password: "secret" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("returns 400 when password missing", async () => {
    mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/sign-in")
      .send({ email: "a@b.com" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("returns 401 on invalid credentials", async () => {
    const supabase = mockSupabase();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: new Error("Invalid login credentials"),
    });

    const res = await request(app)
      .post("/api/v1/auth/sign-in")
      .send({ email: "a@b.com", password: "wrong" });

    expect(res.status).toBe(401);
  });
});

describe("POST /sign-up", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 on successful sign up", async () => {
    const supabase = mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/sign-up")
      .send({ email: "new@b.com", password: "secret123", fullName: "New User" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "new@b.com",
      password: "secret123",
      options: expect.objectContaining({
        data: { full_name: "New User" },
      }),
    });
  });

  it("returns 400 when email missing", async () => {
    mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/sign-up")
      .send({ password: "secret123" });

    expect(res.status).toBe(400);
  });

  it("returns 200 without fullName", async () => {
    const supabase = mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/sign-up")
      .send({ email: "new@b.com", password: "secret123" });

    expect(res.status).toBe(200);
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "new@b.com",
      password: "secret123",
      options: expect.objectContaining({
        data: { full_name: null },
      }),
    });
  });
});

describe("GET /me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
  });

  it("returns user profile with valid auth token", async () => {
    const supabase = mockSupabase();
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: "user-1", full_name: "Test User", email: "test@example.com", phone: null, title: null, is_super_admin: false, default_organization_id: null, created_at: "" },
            error: null,
          }),
        }),
      }),
    });

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer token-123");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe("user-1");
    expect(res.body.data.fullName).toBe("Test User");
  });
});
