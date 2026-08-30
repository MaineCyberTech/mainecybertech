import { jest } from "@jest/globals";

const mockTicketsAddComment = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  tickets: { addComment: mockTicketsAddComment },
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

describe("addPortalTicketComment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds a comment successfully", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTicketComment } =
      await import("@/app/(portal)/portal/support/[ticketId]/actions");

    const formData = new FormData();
    formData.set("ticketId", "ticket-1");
    formData.set("body", "Thanks for the update!");

    await addPortalTicketComment(formData);

    expect(mockTicketsAddComment).toHaveBeenCalledWith("ticket-1", {
      organizationId: "org-1",
      body: "Thanks for the update!",
      isInternal: false,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/support/ticket-1");
  });

  it("returns error when ticketId is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTicketComment } =
      await import("@/app/(portal)/portal/support/[ticketId]/actions");

    const formData = new FormData();
    formData.set("body", "Hello");

    const result = await addPortalTicketComment(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Ticket ID and comment body");
    expect(mockTicketsAddComment).not.toHaveBeenCalled();
  });

  it("returns error when body is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTicketComment } =
      await import("@/app/(portal)/portal/support/[ticketId]/actions");

    const formData = new FormData();
    formData.set("ticketId", "ticket-1");

    const result = await addPortalTicketComment(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Ticket ID and comment body");
    expect(mockTicketsAddComment).not.toHaveBeenCalled();
  });

  it("returns error when body is whitespace", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTicketComment } =
      await import("@/app/(portal)/portal/support/[ticketId]/actions");

    const formData = new FormData();
    formData.set("ticketId", "ticket-1");
    formData.set("body", "   ");

    const result = await addPortalTicketComment(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Ticket ID and comment body");
    expect(mockTicketsAddComment).not.toHaveBeenCalled();
  });

  it("returns error when no approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { addPortalTicketComment } =
      await import("@/app/(portal)/portal/support/[ticketId]/actions");

    const formData = new FormData();
    formData.set("ticketId", "ticket-1");
    formData.set("body", "Hello");

    const result = await addPortalTicketComment(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("No approved organization membership found");
    expect(mockTicketsAddComment).not.toHaveBeenCalled();
  });
});
