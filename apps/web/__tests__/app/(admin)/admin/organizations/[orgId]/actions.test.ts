import { jest } from "@jest/globals";

const mockOrganizationsUpdate = jest.fn();
const mockOrganizationsAddDomain = jest.fn();
const mockOrganizationsUpdateDomain = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  organizations: {
    update: mockOrganizationsUpdate,
    addDomain: mockOrganizationsAddDomain,
    updateDomain: mockOrganizationsUpdateDomain,
  },
});
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("updateOrganizationBasics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates organization with all fields", async () => {
    const { updateOrganizationBasics } = await import(
      "@/app/(admin)/admin/organizations/[orgId]/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("name", "Acme Corp");
    formData.set("slug", "acme-corp");
    formData.set("status", "approved");
    formData.set("primaryDomain", "acme.com");
    formData.set("supportPlan", "premium");

    await updateOrganizationBasics(formData);

    expect(mockOrganizationsUpdate).toHaveBeenCalledWith("org-1", {
      name: "Acme Corp",
      slug: "acme-corp",
      status: "approved",
      primaryDomain: "acme.com",
      supportPlan: "premium",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      "/admin/organizations/org-1",
    );
  });

  it("uses null for empty optional fields", async () => {
    const { updateOrganizationBasics } = await import(
      "@/app/(admin)/admin/organizations/[orgId]/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("name", "Acme");
    formData.set("slug", "acme");
    formData.set("status", "pending");

    await updateOrganizationBasics(formData);

    expect(mockOrganizationsUpdate).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ primaryDomain: null, supportPlan: null }),
    );
  });

  it("lowercases slug and primaryDomain", async () => {
    const { updateOrganizationBasics } = await import(
      "@/app/(admin)/admin/organizations/[orgId]/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("name", "Acme");
    formData.set("slug", "ACME-CORP");
    formData.set("primaryDomain", "ACME.COM");

    await updateOrganizationBasics(formData);

    expect(mockOrganizationsUpdate).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ slug: "acme-corp", primaryDomain: "acme.com" }),
    );
  });
});

describe("createOrganizationDomain", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a domain with autoApprove", async () => {
    const { createOrganizationDomain } = await import(
      "@/app/(admin)/admin/organizations/[orgId]/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("domain", "example.com");
    formData.set("autoApprove", "true");

    await createOrganizationDomain(formData);

    expect(mockOrganizationsAddDomain).toHaveBeenCalledWith("org-1", {
      domain: "example.com",
      autoApprove: true,
    });
  });

  it("creates a domain without autoApprove", async () => {
    const { createOrganizationDomain } = await import(
      "@/app/(admin)/admin/organizations/[orgId]/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("domain", "example.com");

    await createOrganizationDomain(formData);

    expect(mockOrganizationsAddDomain).toHaveBeenCalledWith("org-1", {
      domain: "example.com",
      autoApprove: false,
    });
  });

  it("lowercases the domain", async () => {
    const { createOrganizationDomain } = await import(
      "@/app/(admin)/admin/organizations/[orgId]/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("domain", "EXAMPLE.COM");

    await createOrganizationDomain(formData);

    expect(mockOrganizationsAddDomain).toHaveBeenCalledWith("org-1", {
      domain: "example.com",
      autoApprove: false,
    });
  });

  it("returns early when domain is empty", async () => {
    const { createOrganizationDomain } = await import(
      "@/app/(admin)/admin/organizations/[orgId]/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("domain", "");

    await createOrganizationDomain(formData);

    expect(mockOrganizationsAddDomain).not.toHaveBeenCalled();
  });
});

describe("updateOrganizationDomain", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates domain with autoApprove true", async () => {
    const { updateOrganizationDomain } = await import(
      "@/app/(admin)/admin/organizations/[orgId]/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("domainId", "dom-1");
    formData.set("autoApprove", "true");

    await updateOrganizationDomain(formData);

    expect(mockOrganizationsUpdateDomain).toHaveBeenCalledWith("org-1", "dom-1", {
      autoApprove: true,
    });
  });

  it("updates domain with autoApprove false", async () => {
    const { updateOrganizationDomain } = await import(
      "@/app/(admin)/admin/organizations/[orgId]/actions"
    );

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("domainId", "dom-1");

    await updateOrganizationDomain(formData);

    expect(mockOrganizationsUpdateDomain).toHaveBeenCalledWith("org-1", "dom-1", {
      autoApprove: false,
    });
  });
});
