import { jest } from "@jest/globals";

const mockCookieSet = jest.fn();
const mockCookieDelete = jest.fn();
const mockCookieGet = jest.fn().mockReturnValue({ value: "test-token" });
const mockRedirect = jest.fn();
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockMfaFactors = jest.fn();
const mockMfaChallenge = jest.fn();
const mockMfaVerify = jest.fn();
const mockMfaRecover = jest.fn();
const mockMe = jest.fn();
const mockMembershipsList = jest.fn();
const mockHeaders = jest.fn().mockResolvedValue({
  get: jest.fn().mockReturnValue("localhost:3000"),
});

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    set: mockCookieSet,
    delete: mockCookieDelete,
    get: mockCookieGet,
  }),
  headers: mockHeaders,
}));

jest.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

jest.mock("@mct/sdk", () => ({
  MCTClient: {
    create: jest.fn().mockReturnValue({
      auth: {
        signIn: mockSignIn,
        signUp: mockSignUp,
        mfaFactors: mockMfaFactors,
        mfaChallenge: mockMfaChallenge,
        mfaVerify: mockMfaVerify,
        mfaRecover: mockMfaRecover,
      },
      users: {
        me: mockMe,
      },
      memberships: {
        list: mockMembershipsList,
      },
    }),
  },
  ApiError: class ApiError extends Error {
    code: string;
    status: number;
    constructor(code: string, message: string, status: number) {
      super(message);
      this.code = code;
      this.status = status;
      this.name = "ApiError";
    }
  },
}));

const SESSION_COOKIE = "mct_session";
const MFA_PENDING_COOKIE = "mct_mfa_pending";

describe("auth-actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookieGet.mockReturnValue({ value: "test-token" });
    mockHeaders.mockResolvedValue({
      get: jest.fn().mockReturnValue("localhost:3000"),
    });
  });

  describe("loginAction", () => {
    it("sets cookie and redirects on success", async () => {
      mockSignIn.mockResolvedValue({
        accessToken: "token-123",
        user: { id: "user-1", email: "a@b.com" },
      });

      const { loginAction } = await import("@/lib/auth/auth-actions");
      await loginAction("a@b.com", "password");

      expect(mockSignIn).toHaveBeenCalledWith("a@b.com", "password");
      expect(mockCookieSet).toHaveBeenCalledWith(
        SESSION_COOKIE,
        "token-123",
        expect.objectContaining({ httpOnly: true, path: "/" }),
      );
      expect(mockRedirect).toHaveBeenCalledWith("/portal/dashboard");
    });

    it("returns error message on ApiError", async () => {
      const { ApiError } = await import("@mct/sdk");
      mockSignIn.mockRejectedValue(new ApiError("AUTH_ERROR", "Invalid credentials", 401));

      const { loginAction } = await import("@/lib/auth/auth-actions");
      const result = await loginAction("a@b.com", "wrong");

      expect(result).toEqual({ error: "Invalid credentials" });
      expect(mockCookieSet).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("returns generic error on non-ApiError", async () => {
      mockSignIn.mockRejectedValue(new Error("Network failure"));

      const { loginAction } = await import("@/lib/auth/auth-actions");
      const result = await loginAction("a@b.com", "password");

      expect(result).toEqual({ error: "An unexpected error occurred" });
    });

    it("stores a short-lived pending cookie when a second factor is required", async () => {
      mockSignIn.mockResolvedValue({
        accessToken: "aal1-token",
        user: { id: "user-1", email: "a@b.com" },
        mfaRequired: true,
      });

      const { loginAction } = await import("@/lib/auth/auth-actions");
      const result = await loginAction("a@b.com", "password");

      expect(result).toEqual({ mfaRequired: true });
      expect(mockCookieSet).toHaveBeenCalledWith(
        MFA_PENDING_COOKIE,
        "aal1-token",
        expect.objectContaining({ httpOnly: true, maxAge: 600 }),
      );
      expect(mockCookieSet).not.toHaveBeenCalledWith(
        SESSION_COOKIE,
        expect.anything(),
        expect.anything(),
      );
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("mfaLoginVerifyAction", () => {
    beforeEach(() => {
      mockCookieGet.mockReturnValue({ value: "aal1-token" });
    });

    it("verifies the code, sets the session cookie and redirects", async () => {
      mockMfaFactors.mockResolvedValue({
        totp: [{ id: "f1", status: "verified" }],
        all: [],
      });
      mockMfaChallenge.mockResolvedValue({ challengeId: "c1", expiresAt: 123 });
      mockMfaVerify.mockResolvedValue({
        accessToken: "aal2-token",
        user: { id: "user-1", email: "a@b.com" },
      });

      const { mfaLoginVerifyAction } = await import("@/lib/auth/auth-actions");
      await mfaLoginVerifyAction("123456");

      expect(mockMfaChallenge).toHaveBeenCalledWith("f1");
      expect(mockMfaVerify).toHaveBeenCalledWith("f1", "c1", "123456");
      expect(mockCookieSet).toHaveBeenCalledWith(
        SESSION_COOKIE,
        "aal2-token",
        expect.objectContaining({ httpOnly: true, path: "/" }),
      );
      expect(mockCookieDelete).toHaveBeenCalledWith(MFA_PENDING_COOKIE);
      expect(mockRedirect).toHaveBeenCalledWith("/portal/dashboard");
    });

    it("returns an error when the pending sign-in expired", async () => {
      mockCookieGet.mockReturnValue(undefined);

      const { mfaLoginVerifyAction } = await import("@/lib/auth/auth-actions");
      const result = await mfaLoginVerifyAction("123456");

      expect(result).toEqual({
        error: "Your sign-in attempt expired. Please sign in again.",
      });
      expect(mockMfaChallenge).not.toHaveBeenCalled();
    });

    it("returns an error when no authenticator is enrolled", async () => {
      mockMfaFactors.mockResolvedValue({ totp: [], all: [] });

      const { mfaLoginVerifyAction } = await import("@/lib/auth/auth-actions");
      const result = await mfaLoginVerifyAction("123456");

      expect(result).toEqual({ error: "No authenticator app is enrolled for this account." });
    });

    it("returns the API error for an invalid code", async () => {
      const { ApiError } = await import("@mct/sdk");
      mockMfaFactors.mockResolvedValue({
        totp: [{ id: "f1", status: "verified" }],
        all: [],
      });
      mockMfaChallenge.mockResolvedValue({ challengeId: "c1", expiresAt: 123 });
      mockMfaVerify.mockRejectedValue(new ApiError("AUTH_ERROR", "Invalid TOTP code", 401));

      const { mfaLoginVerifyAction } = await import("@/lib/auth/auth-actions");
      const result = await mfaLoginVerifyAction("000000");

      expect(result).toEqual({ error: "Invalid TOTP code" });
      expect(mockCookieSet).not.toHaveBeenCalled();
    });
  });

  describe("mfaRecoveryLoginAction", () => {
    beforeEach(() => {
      mockCookieGet.mockReturnValue({ value: "aal1-token" });
    });

    it("spends the code, keeps the pending aal1 session and redirects to the security page", async () => {
      mockMfaRecover.mockResolvedValue({ ok: true, factorsRemoved: 1 });

      const { mfaRecoveryLoginAction } = await import("@/lib/auth/auth-actions");
      await mfaRecoveryLoginAction("ABCDE-FGHIJ");

      expect(mockMfaRecover).toHaveBeenCalledWith("ABCDE-FGHIJ");
      expect(mockCookieSet).toHaveBeenCalledWith(
        SESSION_COOKIE,
        "aal1-token",
        expect.objectContaining({ httpOnly: true, path: "/" }),
      );
      expect(mockCookieDelete).toHaveBeenCalledWith(MFA_PENDING_COOKIE);
      expect(mockRedirect).toHaveBeenCalledWith("/portal/profile/security?recovered=1");
    });

    it("returns the expired message when there is no pending sign-in", async () => {
      mockCookieGet.mockReturnValue(undefined);

      const { mfaRecoveryLoginAction } = await import("@/lib/auth/auth-actions");
      const result = await mfaRecoveryLoginAction("ABCDE-FGHIJ");

      expect(result).toEqual({
        error: "Your sign-in attempt expired. Please sign in again.",
      });
      expect(mockMfaRecover).not.toHaveBeenCalled();
      expect(mockCookieSet).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("returns the API error and keeps the pending cookie for an invalid code", async () => {
      const { ApiError } = await import("@mct/sdk");
      mockMfaRecover.mockRejectedValue(
        new ApiError("INVALID_RECOVERY_CODE", "Invalid recovery code", 401),
      );

      const { mfaRecoveryLoginAction } = await import("@/lib/auth/auth-actions");
      const result = await mfaRecoveryLoginAction("WRONG-CODE1");

      expect(result).toEqual({ error: "Invalid recovery code" });
      expect(mockCookieSet).not.toHaveBeenCalled();
      expect(mockCookieDelete).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("mfaCancelAction", () => {
    it("clears the pending cookie", async () => {
      const { mfaCancelAction } = await import("@/lib/auth/auth-actions");
      await mfaCancelAction();

      expect(mockCookieDelete).toHaveBeenCalledWith(MFA_PENDING_COOKIE);
    });
  });

  describe("signupAction", () => {
    it("calls signUp and returns success", async () => {
      mockSignUp.mockResolvedValue({
        user: { id: "user-1", email: "a@b.com" },
      });

      const { signupAction } = await import("@/lib/auth/auth-actions");
      const result = await signupAction("a@b.com", "password", "Alice");

      expect(mockSignUp).toHaveBeenCalledWith("a@b.com", "password", "Alice");
      expect(result).toEqual({ success: true });
    });

    it("returns error on failure", async () => {
      const { ApiError } = await import("@mct/sdk");
      mockSignUp.mockRejectedValue(new ApiError("VALIDATION", "Email already in use", 400));

      const { signupAction } = await import("@/lib/auth/auth-actions");
      const result = await signupAction("a@b.com", "password", "Alice");

      expect(result).toEqual({ error: "Email already in use" });
    });
  });

  describe("logoutAction", () => {
    it("deletes cookie and redirects", async () => {
      const { logoutAction } = await import("@/lib/auth/auth-actions");
      await logoutAction();

      expect(mockCookieDelete).toHaveBeenCalledWith(SESSION_COOKIE);
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("testLoginAction", () => {
    it("sets cookie and lands admins in /admin", async () => {
      mockSignIn.mockResolvedValue({
        accessToken: "token-456",
        user: { id: "user-1", email: "admin@test.com" },
      });
      mockMe.mockResolvedValue({ userId: "user-1", email: "admin@test.com" });
      mockMembershipsList.mockResolvedValue([
        { organization_id: "o1", roles: { key: "super_admin" } },
      ]);

      const { testLoginAction } = await import("@/lib/auth/auth-actions");
      const result = await testLoginAction("admin@test.com", "1");

      expect(result).toEqual({ ok: true, redirectTo: "/admin" });
      expect(mockCookieSet).toHaveBeenCalledWith(
        SESSION_COOKIE,
        "token-456",
        expect.objectContaining({ httpOnly: true, path: "/" }),
      );
    });

    it("lands client users in the portal dashboard", async () => {
      mockSignIn.mockResolvedValue({
        accessToken: "token-789",
        user: { id: "user-2", email: "client@test.com" },
      });
      mockMe.mockResolvedValue({ userId: "user-2", email: "client@test.com" });
      mockMembershipsList.mockResolvedValue([
        { organization_id: "o1", roles: { key: "client_user" } },
      ]);

      const { testLoginAction } = await import("@/lib/auth/auth-actions");
      const result = await testLoginAction("client@test.com", "1");

      expect(result).toEqual({ ok: true, redirectTo: "/portal/dashboard" });
    });

    it("falls back to the portal when the role lookup fails", async () => {
      mockSignIn.mockResolvedValue({
        accessToken: "token-abc",
        user: { id: "user-3", email: "x@test.com" },
      });
      mockMe.mockRejectedValue(new Error("boom"));

      const { testLoginAction } = await import("@/lib/auth/auth-actions");
      const result = await testLoginAction("x@test.com", "1");

      expect(result).toEqual({ ok: true, redirectTo: "/portal/dashboard" });
      expect(mockCookieSet).toHaveBeenCalled();
    });

    it("returns an error when sign-in fails", async () => {
      const { ApiError } = await import("@mct/sdk");
      mockSignIn.mockRejectedValue(new ApiError("AUTH_ERROR", "Invalid credentials", 401));

      const { testLoginAction } = await import("@/lib/auth/auth-actions");
      const result = await testLoginAction("bad@test.com", "wrong");

      expect(result).toEqual({ ok: false, error: "Invalid credentials" });
      expect(mockCookieSet).not.toHaveBeenCalled();
    });

    it("refuses when the account requires a second factor", async () => {
      mockSignIn.mockResolvedValue({
        accessToken: "aal1-token",
        user: { id: "user-1", email: "a@b.com" },
        mfaRequired: true,
      });

      const { testLoginAction } = await import("@/lib/auth/auth-actions");
      const result = await testLoginAction("a@b.com", "1");

      expect(result).toEqual({
        ok: false,
        error: "This account requires an authenticator code. Sign in from the login page.",
      });
      expect(mockCookieSet).not.toHaveBeenCalled();
    });
  });
});
