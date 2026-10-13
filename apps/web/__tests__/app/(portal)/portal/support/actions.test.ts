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
    mockTicketsCreate.mockResolvedValue({ id: "ticket-9", title: "Test ticket" });
  });

  it("creates a ticket from the fields the support form submits (USE-P3-001)", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { createPortalTicket } = await import("@/app/(portal)/portal/support/actions");

    const formData = new FormData();
    formData.set("subject", "Test ticket");
    formData.set("description", "Help needed");
    formData.set("priority", "high");
    formData.set("category", "billing");

    const result = await createPortalTicket(formData);

    expect(mockTicketsCreate).toHaveBeenCalledWith({
      organizationId: "org-1",
      title: "Test ticket",
      description: "Help needed",
      priority: "high",
      category: "billing",
      source: "portal",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/support");
    // USE-P3-001: the caller needs the created ticket for the confirmation.
    expect(result).toEqual({ ok: true, ticketId: "ticket-9", subject: "Test ticket" });
  });

  it("uses default priority when not provided", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { createPortalTicket } = await import("@/app/(portal)/portal/support/actions");

    const formData = new FormData();
    formData.set("subject", "Test");

    await createPortalTicket(formData);

    expect(mockTicketsCreate).toHaveBeenCalledWith(expect.objectContaining({ priority: "normal" }));
  });

  it("uses null for empty description and category", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { createPortalTicket } = await import("@/app/(portal)/portal/support/actions");

    const formData = new FormData();
    formData.set("subject", "Test");

    await createPortalTicket(formData);

    expect(mockTicketsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ description: null, category: null }),
    );
  });

  it("returns error when no approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { createPortalTicket } = await import("@/app/(portal)/portal/support/actions");

    const formData = new FormData();
    formData.set("subject", "Test");

    const result = await createPortalTicket(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("No approved organization membership found");
    expect(mockTicketsCreate).not.toHaveBeenCalled();
  });

  it("returns error when subject is empty or whitespace", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { createPortalTicket } = await import("@/app/(portal)/portal/support/actions");

    const formData = new FormData();
    formData.set("subject", "   ");

    const result = await createPortalTicket(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Title is required");
    expect(mockTicketsCreate).not.toHaveBeenCalled();
  });

  it("returns error when subject is missing from form data", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { createPortalTicket } = await import("@/app/(portal)/portal/support/actions");

    const result = await createPortalTicket(new FormData());
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Title is required");
  });

  it("maps a thrown API error to a user-facing message (USE-P3-005)", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockTicketsCreate.mockRejectedValue(new Error("Request timed out after 30000ms"));

    const { createPortalTicket } = await import("@/app/(portal)/portal/support/actions");

    const formData = new FormData();
    formData.set("subject", "Test");

    const result = await createPortalTicket(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/took too long/i);
  });
});
