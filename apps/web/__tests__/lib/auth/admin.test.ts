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
    mockMembershipsList.mockResolvedValue([
      { roles: { key: "admin" }, status: "approved" },
    ]);

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    const result = await requireAdminAccess();

    expect(result).toEqual({ userId: "user-1", roleKey: "admin" });
  });

  it("redirects to login when me() throws", async () => {
    mockMe.mockRejectedValue(new Error("Unauthorized"));

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to login when user has no userId", async () => {
    mockMe.mockResolvedValue({ userId: null, email: null });

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to dashboard when memberships list throws", async () => {
    mockMe.mockResolvedValue({ userId: "user-1", email: "u@test.com" });
    mockMembershipsList.mockRejectedValue(new Error("DB error"));

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/portal/dashboard");
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
    mockMembershipsList.mockResolvedValue([
      { roles: { key: "viewer" }, status: "approved" },
    ]);

    const { requireAdminAccess } = await import("@/lib/auth/admin");
    await expect(requireAdminAccess()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/portal/dashboard");
  });
});
