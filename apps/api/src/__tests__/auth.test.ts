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
  getScopedClient: jest.fn((_req, _moduleKey, _kind) =>
    require("../services/supabase").getSupabaseAdmin(),
  ),
  getSupabaseUser: jest.fn(),
}));

jest.mock("../services/audit", () => ({
  logAuditEvent: jest.fn(),
}));

import { getSupabaseAdmin, getSupabaseUser } from "../services/supabase";

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
      mfa: {
        listFactors: jest.fn().mockResolvedValue({
          data: {
            all: [{ id: "f1", factor_type: "totp", friendly_name: "Phone", status: "verified" }],
            totp: [
              { id: "f1", friendly_name: "Phone", status: "verified", created_at: "2026-01-01" },
            ],
          },
          error: null,
        }),
        enroll: jest.fn().mockResolvedValue({
          data: {
            id: "f1",
            type: "totp",
            friendly_name: "Phone",
            totp: { qr_code: "<svg/>", secret: "ABC123", uri: "otpauth://totp/x" },
          },
          error: null,
        }),
        challenge: jest
          .fn()
          .mockResolvedValue({ data: { id: "c1", expires_at: 123 }, error: null }),
        verify: jest.fn().mockResolvedValue({
          data: { access_token: "aal2-token", user: { id: "user-1", email: "test@example.com" } },
          error: null,
        }),
        unenroll: jest.fn().mockResolvedValue({ data: { id: "f1" }, error: null }),
      },
    },
  };
  (getSupabaseAdmin as jest.Mock).mockReturnValue(mock);
  (getSupabaseUser as jest.Mock).mockReturnValue(mock);
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

    const res = await request(app).post("/api/v1/auth/sign-in").send({ password: "secret" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("returns 400 when password missing", async () => {
    mockSupabase();

    const res = await request(app).post("/api/v1/auth/sign-in").send({ email: "a@b.com" });

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

    const res = await request(app).post("/api/v1/auth/sign-up").send({
      email: "new@b.com",
      password: "SecurePass123!",
      fullName: "New User",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "new@b.com",
      password: "SecurePass123!",
      options: expect.objectContaining({
        data: { full_name: "New User" },
      }),
    });
  });

  it("returns 400 when email missing", async () => {
    mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/sign-up")
      .send({ password: "SecurePass123!" });

    expect(res.status).toBe(400);
  });

  it("returns 200 without fullName", async () => {
    const supabase = mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/sign-up")
      .send({ email: "new@b.com", password: "SecurePass123!" });

    expect(res.status).toBe(200);
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "new@b.com",
      password: "SecurePass123!",
      options: expect.objectContaining({
        data: { full_name: null },
      }),
    });
  });
});

describe("forgot-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends reset email", async () => {
    const supabase = mockSupabase();
    supabase.auth.resetPasswordForEmail = jest.fn().mockResolvedValue({
      data: {},
      error: null,
    });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "test@example.com",
      expect.any(Object),
    );
  });

  it("returns 400 for missing email", async () => {
    mockSupabase();

    const res = await request(app).post("/api/v1/auth/forgot-password").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION");
  });
});

describe("reset-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resets password when authenticated with matching email", async () => {
    const supabase = mockSupabase();
    supabase.auth.admin = {
      updateUserById: jest.fn().mockResolvedValue({ data: {}, error: null }),
    };

    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("Authorization", "Bearer token-123")
      .send({ email: "test@example.com", password: "StrongP@ss1" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith("user-1", {
      password: "StrongP@ss1",
    });
  });

  it("returns 403 when email does not match authenticated user", async () => {
    mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("Authorization", "Bearer token-123")
      .send({ email: "other@example.com", password: "StrongP@ss1" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBeDefined();
  });

  it("returns 401 without auth", async () => {
    mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ email: "test@example.com", password: "StrongP@ss1" });

    expect(res.status).toBe(401);
  });

  it("returns 400 for weak password", async () => {
    mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("Authorization", "Bearer token-123")
      .send({ email: "test@example.com", password: "weak" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION");
  });

  it("returns 400 for missing fields", async () => {
    mockSupabase();

    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .set("Authorization", "Bearer token-123")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION");
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
            data: {
              id: "user-1",
              full_name: "Test User",
              email: "test@example.com",
              phone: null,
              title: null,
              is_super_admin: false,
              default_organization_id: null,
              created_at: "",
            },
            error: null,
          }),
        }),
      }),
    });

    const res = await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer token-123");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe("user-1");
    expect(res.body.data.fullName).toBe("Test User");
  });
});

describe("MFA (TOTP) management", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for factors without auth", async () => {
    mockSupabase();
    const res = await request(app).get("/api/v1/auth/mfa/factors");
    expect(res.status).toBe(401);
  });

  it("lists factors", async () => {
    const supabase = mockSupabase();
    const res = await request(app)
      .get("/api/v1/auth/mfa/factors")
      .set("Authorization", "Bearer token-123");
    expect(res.status).toBe(200);
    expect(res.body.data.totp[0].id).toBe("f1");
    expect(supabase.auth.mfa.listFactors).toHaveBeenCalled();
  });

  it("enrolls a totp factor and returns the secret", async () => {
    const supabase = mockSupabase();
    const res = await request(app)
      .post("/api/v1/auth/mfa/enroll")
      .set("Authorization", "Bearer token-123")
      .send({ friendlyName: "Phone" });
    expect(res.status).toBe(201);
    expect(res.body.data.factorId).toBe("f1");
    expect(res.body.data.secret).toBe("ABC123");
    expect(supabase.auth.mfa.enroll).toHaveBeenCalledWith({
      factorType: "totp",
      friendlyName: "Phone",
    });
  });

  it("rejects an over-long friendly name", async () => {
    mockSupabase();
    const res = await request(app)
      .post("/api/v1/auth/mfa/enroll")
      .set("Authorization", "Bearer token-123")
      .send({ friendlyName: "x".repeat(65) });
    expect(res.status).toBe(400);
  });

  it("creates a challenge", async () => {
    mockSupabase();
    const res = await request(app)
      .post("/api/v1/auth/mfa/challenge")
      .set("Authorization", "Bearer token-123")
      .send({ factorId: "f1" });
    expect(res.status).toBe(200);
    expect(res.body.data.challengeId).toBe("c1");
  });

  it("verifies a code and returns the upgraded token", async () => {
    mockSupabase();
    const res = await request(app)
      .post("/api/v1/auth/mfa/verify")
      .set("Authorization", "Bearer token-123")
      .send({ factorId: "f1", challengeId: "c1", code: "123456" });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBe("aal2-token");
  });

  it("rejects a malformed code", async () => {
    mockSupabase();
    const res = await request(app)
      .post("/api/v1/auth/mfa/verify")
      .set("Authorization", "Bearer token-123")
      .send({ factorId: "f1", challengeId: "c1", code: "12" });
    expect(res.status).toBe(400);
  });

  it("unenrolls a factor", async () => {
    const supabase = mockSupabase();
    const res = await request(app)
      .delete("/api/v1/auth/mfa/factors/f1")
      .set("Authorization", "Bearer token-123");
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
    expect(supabase.auth.mfa.unenroll).toHaveBeenCalledWith({ factorId: "f1" });
  });
});
