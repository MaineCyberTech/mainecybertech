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

    const { addPortalTicketComment } = await import(
      "@/app/(portal)/portal/support/[ticketId]/actions"
    );

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

  it("throws when ticketId is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTicketComment } = await import(
      "@/app/(portal)/portal/support/[ticketId]/actions"
    );

    const formData = new FormData();
    formData.set("body", "Hello");

    await expect(addPortalTicketComment(formData)).rejects.toThrow(
      "Ticket ID and comment body are required.",
    );
    expect(mockTicketsAddComment).not.toHaveBeenCalled();
  });

  it("throws when body is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTicketComment } = await import(
      "@/app/(portal)/portal/support/[ticketId]/actions"
    );

    const formData = new FormData();
    formData.set("ticketId", "ticket-1");

    await expect(addPortalTicketComment(formData)).rejects.toThrow(
      "Ticket ID and comment body are required.",
    );
    expect(mockTicketsAddComment).not.toHaveBeenCalled();
  });

  it("throws when body is whitespace", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTicketComment } = await import(
      "@/app/(portal)/portal/support/[ticketId]/actions"
    );

    const formData = new FormData();
    formData.set("ticketId", "ticket-1");
    formData.set("body", "   ");

    await expect(addPortalTicketComment(formData)).rejects.toThrow(
      "Ticket ID and comment body are required.",
    );
    expect(mockTicketsAddComment).not.toHaveBeenCalled();
  });

  it("throws when no approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { addPortalTicketComment } = await import(
      "@/app/(portal)/portal/support/[ticketId]/actions"
    );

    const formData = new FormData();
    formData.set("ticketId", "ticket-1");
    formData.set("body", "Hello");

    await expect(addPortalTicketComment(formData)).rejects.toThrow(
      "No approved organization membership found.",
    );
    expect(mockTicketsAddComment).not.toHaveBeenCalled();
  });
});
