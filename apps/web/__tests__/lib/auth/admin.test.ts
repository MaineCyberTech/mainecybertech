import { jest } from "@jest/globals";

const mockRedirect = jest.fn().mockImplementation(() => {
  throw new Error("NEXT_REDIRECT");
});
const mockMe = jest.fn();
const mockMembershipsList = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: "test-token" }),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

jest.mock("@mct/sdk", () => ({
  MCTClient: {
    create: jest.fn().mockReturnValue({
      users: { me: mockMe },
      memberships: { list: mockMembershipsList },
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

describe("requireAdminAccess", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns userId and roleKey for admin user", async () => {
    mockMe.mockResolvedValue({ userId: "user-1", email: "admin@test.com" });
    mockMembershipsList.mockResolvedValue([{ roles: { key: "admin" }, status: "approved" }]);

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    const result = await requireAdminAccess();

    expect(result).toEqual({ userId: "user-1", roleKey: "admin" });
  });

  it("redirects to login when me() throws 401", async () => {
    mockMe.mockRejectedValue(Object.assign(new Error("Unauthorized"), { status: 401 }));

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("rethrows transient me() failures instead of redirecting", async () => {
    mockMe.mockRejectedValue(Object.assign(new Error("Internal error"), { status: 500 }));

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("Internal error");

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to the MFA step-up page when a factor must be verified", async () => {
    mockMe.mockRejectedValue(Object.assign(new Error("MFA required"), { code: "MFA_REQUIRED" }));

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/portal/profile/security?mfa=required");
  });

  it("redirects to login when user has no userId", async () => {
    mockMe.mockResolvedValue({ userId: null, email: null });

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to dashboard when memberships list throws 403", async () => {
    mockMe.mockResolvedValue({ userId: "user-1", email: "u@test.com" });
    mockMembershipsList.mockRejectedValue(Object.assign(new Error("Forbidden"), { status: 403 }));

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/portal/dashboard");
  });

  it("rethrows transient memberships failures instead of redirecting", async () => {
    mockMe.mockResolvedValue({ userId: "user-1", email: "u@test.com" });
    mockMembershipsList.mockRejectedValue(Object.assign(new Error("DB error"), { status: 500 }));

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("DB error");

    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to dashboard when no approved memberships", async () => {
    mockMe.mockResolvedValue({ userId: "user-1", email: "u@test.com" });
    mockMembershipsList.mockResolvedValue([]);

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/portal/dashboard");
  });

  it("redirects to dashboard when user is not admin", async () => {
    mockMe.mockResolvedValue({ userId: "user-1", email: "u@test.com" });
    mockMembershipsList.mockResolvedValue([{ roles: { key: "viewer" }, status: "approved" }]);

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/portal/dashboard");
  });
});
