import { jest } from "@jest/globals";

const mockMe = jest.fn();
const mockMembershipsList = jest.fn();

jest.mock("@/lib/org-actions", () => ({
  getActiveOrg: jest.fn().mockResolvedValue(null),
  setActiveOrg: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: "test-token" }),
    set: jest.fn(),
    delete: jest.fn(),
  }),
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

describe("getApprovedMembership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns membership for approved user", async () => {
    mockMe.mockResolvedValue({ userId: "user-1", email: "u@test.com" });
    mockMembershipsList.mockResolvedValue([
      {
        id: "mem-1",
        status: "approved",
        organization_id: "org-1",
        role_id: "role-1",
        organizations: { name: "Test Org" },
      },
    ]);

    const { getApprovedMembership } = await import("@/lib/auth/membership");
    const result = await getApprovedMembership();

    expect(result).toEqual({
      id: "mem-1",
      status: "approved",
      organization_id: "org-1",
      role_id: "role-1",
      organizations: { name: "Test Org" },
    });
  });

  it("returns null when me() throws", async () => {
    mockMe.mockRejectedValue(new Error("Unauthorized"));

    const { getApprovedMembership } = await import("@/lib/auth/membership");
    const result = await getApprovedMembership();

    expect(result).toBeNull();
  });

  it("returns null when user has no userId", async () => {
    mockMe.mockResolvedValue({ userId: null, email: null });

    const { getApprovedMembership } = await import("@/lib/auth/membership");
    const result = await getApprovedMembership();

    expect(result).toBeNull();
  });

  it("returns null when no approved memberships", async () => {
    mockMe.mockResolvedValue({ userId: "user-1", email: "u@test.com" });
    mockMembershipsList.mockResolvedValue([]);

    const { getApprovedMembership } = await import("@/lib/auth/membership");
    const result = await getApprovedMembership();

    expect(result).toBeNull();
  });

  it("returns null and logs error when memberships list throws", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockMe.mockResolvedValue({ userId: "user-1", email: "u@test.com" });
    mockMembershipsList.mockRejectedValue(new Error("DB error"));

    const { getApprovedMembership } = await import("@/lib/auth/membership");
    const result = await getApprovedMembership();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("uses active org cookie when set", async () => {
    const mockGetActiveOrg = (await import("@/lib/org-actions")).getActiveOrg as jest.Mock;
    mockGetActiveOrg.mockResolvedValue("org-2");

    mockMe.mockResolvedValue({ userId: "user-1", email: "u@test.com" });
    mockMembershipsList.mockResolvedValue([
      { id: "mem-1", status: "approved", organization_id: "org-1", role_id: "role-1" },
      { id: "mem-2", status: "approved", organization_id: "org-2", role_id: "role-2" },
    ]);

    const { getApprovedMembership } = await import("@/lib/auth/membership");
    const result = await getApprovedMembership();

    expect(result?.organization_id).toBe("org-2");
    expect(result?.id).toBe("mem-2");
  });
});
