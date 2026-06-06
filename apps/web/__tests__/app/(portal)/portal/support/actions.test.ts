import { jest } from "@jest/globals";

const mockTicketsCreate = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  tickets: { create: mockTicketsCreate },
});
const mockGetApprovedMembership = jest.fn();
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("createPortalTicket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a ticket with all form fields", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { createPortalTicket } = await import(
      "@/app/(portal)/portal/support/actions"
    );

    const formData = new FormData();
    formData.set("title", "Test ticket");
    formData.set("description", "Help needed");
    formData.set("priority", "high");
    formData.set("category", "billing");

    await createPortalTicket(formData);

    expect(mockTicketsCreate).toHaveBeenCalledWith({
      organizationId: "org-1",
      title: "Test ticket",
      description: "Help needed",
      priority: "high",
      category: "billing",
      source: "portal",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/support");
  });

  it("uses default priority when not provided", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { createPortalTicket } = await import(
      "@/app/(portal)/portal/support/actions"
    );

    const formData = new FormData();
    formData.set("title", "Test");

    await createPortalTicket(formData);

    expect(mockTicketsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ priority: "normal" }),
    );
  });

  it("uses null for empty description and category", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { createPortalTicket } = await import(
      "@/app/(portal)/portal/support/actions"
    );

    const formData = new FormData();
    formData.set("title", "Test");

    await createPortalTicket(formData);

    expect(mockTicketsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ description: null, category: null }),
    );
  });

  it("throws when no approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { createPortalTicket } = await import(
      "@/app/(portal)/portal/support/actions"
    );

    const formData = new FormData();
    formData.set("title", "Test");

    await expect(createPortalTicket(formData)).rejects.toThrow(
      "No approved organization membership found.",
    );
    expect(mockTicketsCreate).not.toHaveBeenCalled();
  });

  it("throws when title is empty or whitespace", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { createPortalTicket } = await import(
      "@/app/(portal)/portal/support/actions"
    );

    const formData = new FormData();
    formData.set("title", "   ");

    await expect(createPortalTicket(formData)).rejects.toThrow(
      "Title is required.",
    );
    expect(mockTicketsCreate).not.toHaveBeenCalled();
  });

  it("throws when title is missing from form data", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { createPortalTicket } = await import(
      "@/app/(portal)/portal/support/actions"
    );

    const formData = new FormData();

    await expect(createPortalTicket(formData)).rejects.toThrow(
      "Title is required.",
    );
  });
});
