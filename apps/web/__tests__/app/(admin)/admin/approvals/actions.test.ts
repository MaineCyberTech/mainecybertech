import { jest } from "@jest/globals";

const mockOrganizationsUpdate = jest.fn();
const mockMembershipsUpdate = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  organizations: { update: mockOrganizationsUpdate },
  memberships: { update: mockMembershipsUpdate },
});
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("approveOrganization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("approves an organization", async () => {
    const { approveOrganization } = await import(
      "@/app/(admin)/admin/approvals/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");

    await approveOrganization(formData);

    expect(mockOrganizationsUpdate).toHaveBeenCalledWith("org-1", {
      status: "approved",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/approvals");
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/admin/organizations/org-1",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/audit");
  });
});

describe("rejectOrganization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects an organization", async () => {
    const { rejectOrganization } = await import(
      "@/app/(admin)/admin/approvals/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");

    await rejectOrganization(formData);

    expect(mockOrganizationsUpdate).toHaveBeenCalledWith("org-1", {
      status: "rejected",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/approvals");
  });
});

describe("approveMembership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("approves a membership", async () => {
    const { approveMembership } = await import(
      "@/app/(admin)/admin/approvals/actions"
    );

    const formData = new FormData();
    formData.set("membershipId", "mem-1");

    await approveMembership(formData);

    expect(mockMembershipsUpdate).toHaveBeenCalledWith("mem-1", {
      roleId: "",
      status: "approved",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/approvals");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/audit");
  });
});

describe("rejectMembership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects a membership", async () => {
    const { rejectMembership } = await import(
      "@/app/(admin)/admin/approvals/actions"
    );

    const formData = new FormData();
    formData.set("membershipId", "mem-1");

    await rejectMembership(formData);

    expect(mockMembershipsUpdate).toHaveBeenCalledWith("mem-1", {
      roleId: "",
      status: "rejected",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/approvals");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/audit");
  });
});
