import { jest } from "@jest/globals";

const mockCookieSet = jest.fn();
const mockCookieDelete = jest.fn();
const mockRedirect = jest.fn();
const mockSignIn = jest.fn();
const mockSignUp = jest.fn();
const mockMe = jest.fn();
const mockMembershipsList = jest.fn();
const mockHeaders = jest.fn().mockResolvedValue({
  get: jest.fn().mockReturnValue("localhost:3000"),
});

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    set: mockCookieSet,
    delete: mockCookieDelete,
    get: jest.fn().mockReturnValue({ value: "test-token" }),
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

describe("auth-actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });
});
