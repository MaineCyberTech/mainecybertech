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

    const result = await approveOrganization(formData);

    expect(result).toEqual({ ok: true });
    expect(mockOrganizationsUpdate).toHaveBeenCalledWith("org-1", {
      status: "approved",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/approvals");
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/admin/organizations/org-1",
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/audit");
  });

  it("returns the API error instead of throwing", async () => {
    mockOrganizationsUpdate.mockRejectedValueOnce(new Error("Forbidden"));

    const { approveOrganization } = await import(
      "@/app/(admin)/admin/approvals/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");

    const result = await approveOrganization(formData);

    expect(result).toEqual({ ok: false, error: "Forbidden" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
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

    const result = await rejectOrganization(formData);

    expect(result).toEqual({ ok: true });
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

  it("approves a membership with a status-only PATCH", async () => {
    const { approveMembership } = await import(
      "@/app/(admin)/admin/approvals/actions"
    );

    const formData = new FormData();
    formData.set("membershipId", "mem-1");

    const result = await approveMembership(formData);

    expect(result).toEqual({ ok: true });
    // USE-P1-003: never send roleId: "" — the UUID schema rejects it.
    expect(mockMembershipsUpdate).toHaveBeenCalledWith("mem-1", {
      status: "approved",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/approvals");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/audit");
  });

  it("returns the API error instead of throwing", async () => {
    const { approveMembership } = await import(
      "@/app/(admin)/admin/approvals/actions"
    );
    mockMembershipsUpdate.mockRejectedValueOnce(new Error("Validation failed"));

    const formData = new FormData();
    formData.set("membershipId", "mem-1");

    const result = await approveMembership(formData);

    expect(result).toEqual({ ok: false, error: "Validation failed" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

describe("rejectMembership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects a membership with a status-only PATCH", async () => {
    const { rejectMembership } = await import(
      "@/app/(admin)/admin/approvals/actions"
    );

    const formData = new FormData();
    formData.set("membershipId", "mem-1");

    const result = await rejectMembership(formData);

    expect(result).toEqual({ ok: true });
    expect(mockMembershipsUpdate).toHaveBeenCalledWith("mem-1", {
      status: "rejected",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/approvals");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/audit");
  });

  it("returns the API error instead of throwing", async () => {
    const { rejectMembership } = await import(
      "@/app/(admin)/admin/approvals/actions"
    );
    mockMembershipsUpdate.mockRejectedValueOnce(new Error("Forbidden"));

    const formData = new FormData();
    formData.set("membershipId", "mem-1");

    const result = await rejectMembership(formData);

    expect(result).toEqual({ ok: false, error: "Forbidden" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
