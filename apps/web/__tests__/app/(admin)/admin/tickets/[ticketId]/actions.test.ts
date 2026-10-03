import { jest } from "@jest/globals";

const mockTicketsUpdate = jest.fn();
const mockTicketsAddComment = jest.fn();
const mockUsersMe = jest.fn().mockResolvedValue({ userId: "admin-1", email: "admin@test.com" });
const mockGetApiClient = jest.fn().mockReturnValue({
  users: { me: mockUsersMe },
  tickets: {
    update: mockTicketsUpdate,
    addComment: mockTicketsAddComment,
  },
});
const mockRevalidatePath = jest.fn();

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

const TICKET_ID = "ticket-1";
const ORG_ID = "org-1";

describe("updateTicketAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates a ticket with all fields", async () => {
    const { updateTicketAction } = await import("@/app/(admin)/admin/tickets/[ticketId]/actions");

    const formData = new FormData();
    formData.set("subject", "Fixed title");
    formData.set("description", "Updated desc");
    formData.set("status", "in_progress");
    formData.set("priority", "urgent");
    formData.set("category", "billing");

    await updateTicketAction(TICKET_ID, formData);

    expect(mockTicketsUpdate).toHaveBeenCalledWith(TICKET_ID, {
      title: "Fixed title",
      description: "Updated desc",
      status: "in_progress",
      priority: "urgent",
      category: "billing",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/admin/tickets/${TICKET_ID}`);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/tickets");
  });

  it("returns error if title is missing", async () => {
    const { updateTicketAction } = await import("@/app/(admin)/admin/tickets/[ticketId]/actions");

    const formData = new FormData();
    formData.set("description", "Desc");

    const result = await updateTicketAction(TICKET_ID, formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Title and description");
  });
});

describe("addCommentAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds an internal comment", async () => {
    const { addCommentAction } = await import("@/app/(admin)/admin/tickets/[ticketId]/actions");

    const formData = new FormData();
    formData.set("body", "Internal note");
    formData.set("isInternal", "true");

    await addCommentAction(TICKET_ID, ORG_ID, formData);

    expect(mockTicketsAddComment).toHaveBeenCalledWith(TICKET_ID, {
      body: "Internal note",
      isInternal: true,
      organizationId: ORG_ID,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/admin/tickets/${TICKET_ID}`);
  });

  it("returns error if body is missing", async () => {
    const { addCommentAction } = await import("@/app/(admin)/admin/tickets/[ticketId]/actions");

    const formData = new FormData();
    const result = await addCommentAction(TICKET_ID, ORG_ID, formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Comment body is required");
  });
});

describe("deleteTicketAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns error if confirmation is not DELETE", async () => {
    const { deleteTicketAction } = await import("@/app/(admin)/admin/tickets/[ticketId]/actions");

    const formData = new FormData();
    formData.set("confirmation", "wrong");

    const result = await deleteTicketAction(TICKET_ID, formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("type DELETE");
  });
});
