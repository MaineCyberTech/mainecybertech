import { jest } from "@jest/globals";

const mockTicketsCreate = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  tickets: { create: mockTicketsCreate },
});
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("createTicket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a ticket with all fields", async () => {
    const { createTicket } = await import("@/app/(admin)/admin/tickets/actions");

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("title", "Network issue");
    formData.set("description", "VPN not working");
    formData.set("priority", "high");
    formData.set("category", "network");

    await createTicket(formData);

    expect(mockTicketsCreate).toHaveBeenCalledWith({
      organizationId: "org-1",
      title: "Network issue",
      description: "VPN not working",
      priority: "high",
      category: "network",
      source: "admin",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/tickets");
  });

  it("uses default priority when not provided", async () => {
    const { createTicket } = await import("@/app/(admin)/admin/tickets/actions");

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("title", "Issue");

    await createTicket(formData);

    expect(mockTicketsCreate).toHaveBeenCalledWith(expect.objectContaining({ priority: "normal" }));
  });

  it("uses null for empty description and category", async () => {
    const { createTicket } = await import("@/app/(admin)/admin/tickets/actions");

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("title", "Issue");

    await createTicket(formData);

    expect(mockTicketsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ description: null, category: null }),
    );
  });

  it("returns error when organizationId is missing", async () => {
    const { createTicket } = await import("@/app/(admin)/admin/tickets/actions");

    const formData = new FormData();
    formData.set("title", "Issue");

    const result = await createTicket(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Organization and title");
    expect(mockTicketsCreate).not.toHaveBeenCalled();
  });

  it("returns error when title is empty", async () => {
    const { createTicket } = await import("@/app/(admin)/admin/tickets/actions");

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("title", "");

    const result = await createTicket(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Organization and title");
    expect(mockTicketsCreate).not.toHaveBeenCalled();
  });
});
