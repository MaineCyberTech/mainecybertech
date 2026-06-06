import { jest } from "@jest/globals";

const mockProfilesUpdate = jest.fn();
const mockMembershipsUpdate = jest.fn();
const mockMembershipsList = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  profiles: { update: mockProfilesUpdate },
  memberships: {
    update: mockMembershipsUpdate,
    list: mockMembershipsList,
  },
});
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("updateUserProfileBasics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates profile with all fields", async () => {
    const { updateUserProfileBasics } = await import(
      "@/app/(admin)/admin/users/[userId]/actions"
    );

    const formData = new FormData();
    formData.set("userId", "user-1");
    formData.set("fullName", "Alice Smith");
    formData.set("phone", "+1-555-0100");
    formData.set("title", "Engineer");

    await updateUserProfileBasics(formData);

    expect(mockProfilesUpdate).toHaveBeenCalledWith("user-1", {
      fullName: "Alice Smith",
      phone: "+1-555-0100",
      title: "Engineer",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users/user-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users/user-1/activity");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/audit");
  });

  it("uses null for empty optional fields", async () => {
    const { updateUserProfileBasics } = await import(
      "@/app/(admin)/admin/users/[userId]/actions"
    );

    const formData = new FormData();
    formData.set("userId", "user-1");
    formData.set("fullName", "");
    formData.set("phone", "");
    formData.set("title", "");

    await updateUserProfileBasics(formData);

    expect(mockProfilesUpdate).toHaveBeenCalledWith("user-1", {
      fullName: null,
      phone: null,
      title: null,
    });
  });
});

describe("updateMembership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates membership with all fields", async () => {
    const { updateMembership } = await import(
      "@/app/(admin)/admin/users/[userId]/actions"
    );

    const formData = new FormData();
    formData.set("membershipId", "mem-1");
    formData.set("userId", "user-1");
    formData.set("roleId", "role-admin");
    formData.set("status", "approved");
    formData.set("isBillingContact", "on");
    formData.set("isSecurityContact", "on");

    await updateMembership(formData);

    expect(mockMembershipsUpdate).toHaveBeenCalledWith("mem-1", {
      roleId: "role-admin",
      status: "approved",
      isBillingContact: true,
      isSecurityContact: true,
    });
  });

  it("sets boolean flags to false when not checked", async () => {
    const { updateMembership } = await import(
      "@/app/(admin)/admin/users/[userId]/actions"
    );

    const formData = new FormData();
    formData.set("membershipId", "mem-1");
    formData.set("userId", "user-1");
    formData.set("roleId", "role-viewer");
    formData.set("status", "pending");

    await updateMembership(formData);

    expect(mockMembershipsUpdate).toHaveBeenCalledWith(
      "mem-1",
      expect.objectContaining({ isBillingContact: false, isSecurityContact: false }),
    );
  });

  it("revalidates org paths when membership lookup succeeds", async () => {
    mockMembershipsList.mockResolvedValue([
      { id: "mem-1", organization_id: "org-1" },
    ]);

    const { updateMembership } = await import(
      "@/app/(admin)/admin/users/[userId]/actions"
    );

    const formData = new FormData();
    formData.set("membershipId", "mem-1");
    formData.set("userId", "user-1");
    formData.set("roleId", "role-admin");
    formData.set("status", "approved");

    await updateMembership(formData);

    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/admin/organizations/org-1",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/admin/organizations/org-1/activity",
    );
  });

  it("handles membership lookup failure gracefully", async () => {
    mockMembershipsList.mockRejectedValue(new Error("DB error"));

    const { updateMembership } = await import(
      "@/app/(admin)/admin/users/[userId]/actions"
    );

    const formData = new FormData();
    formData.set("membershipId", "mem-1");
    formData.set("userId", "user-1");
    formData.set("roleId", "role-admin");
    formData.set("status", "approved");

    await expect(updateMembership(formData)).resolves.toBeUndefined();
    expect(mockMembershipsUpdate).toHaveBeenCalledTimes(1);
  });

  it("revalidates user paths", async () => {
    const { updateMembership } = await import(
      "@/app/(admin)/admin/users/[userId]/actions"
    );

    const formData = new FormData();
    formData.set("membershipId", "mem-1");
    formData.set("userId", "user-1");
    formData.set("roleId", "role-admin");
    formData.set("status", "approved");

    await updateMembership(formData);

    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users/user-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users/user-1/activity");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/audit");
  });
});
