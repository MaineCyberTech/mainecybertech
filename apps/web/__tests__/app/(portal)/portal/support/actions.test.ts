import { jest } from "@jest/globals";

const mockTicketsCreate = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  tickets: { create: mockTicketsCreate },
});
const mockGetApprovedMembership = jest.fn();
const mockRevalidatePath = jest.fn();
const mockGetAlgaPsaIntakeConfig = jest.fn();
const mockCreateIntakeTicket = jest.fn();

jest.mock("@/lib/alga-psa", () => ({
  getAlgaPsaIntakeConfig: mockGetAlgaPsaIntakeConfig,
  createIntakeTicket: mockCreateIntakeTicket,
}));

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
    // Default: the Alga intake flag is off, so every pre-existing test keeps
    // exercising the Supabase path exactly as before.
    mockGetAlgaPsaIntakeConfig.mockReturnValue(null);
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

  it("keeps the Supabase path when Alga intake is disabled", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockGetAlgaPsaIntakeConfig.mockReturnValue(null);

    const { createPortalTicket } = await import("@/app/(portal)/portal/support/actions");

    const formData = new FormData();
    formData.set("subject", "Test");

    const result = await createPortalTicket(formData);

    expect(mockCreateIntakeTicket).not.toHaveBeenCalled();
    expect(mockTicketsCreate).toHaveBeenCalledWith(expect.objectContaining({ source: "portal" }));
    expect(result).toEqual({ ok: true, ticketId: "ticket-9", subject: "Test ticket" });
  });

  it("routes to Alga PSA and skips the Supabase create when intake is enabled", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    const algaConfig = {
      baseUrl: "https://psa.example.test/api/v1",
      apiKey: "test-api-key",
      clientId: "11111111-1111-4111-8111-111111111111",
      boardId: "22222222-2222-4222-8222-222222222222",
      statusId: "33333333-3333-4333-8333-333333333333",
      priorityId: "44444444-4444-4444-8444-444444444444",
    };
    mockGetAlgaPsaIntakeConfig.mockReturnValue(algaConfig);
    mockCreateIntakeTicket.mockResolvedValue({
      id: "psa-ticket-1",
      number: "T-1042",
      title: "Test ticket",
    });

    const { createPortalTicket } = await import("@/app/(portal)/portal/support/actions");

    const formData = new FormData();
    formData.set("subject", "Test ticket");
    formData.set("description", "Help needed");
    formData.set("priority", "high");
    formData.set("category", "billing");

    const result = await createPortalTicket(formData);

    expect(mockGetAlgaPsaIntakeConfig).toHaveBeenCalledWith("org-1");
    expect(mockCreateIntakeTicket).toHaveBeenCalledWith({
      config: algaConfig,
      title: "Test ticket",
      description: "Help needed",
      portalOrganizationId: "org-1",
      portalPriority: "high",
      portalCategory: "billing",
      portalBaseUrl: process.env.APP_BASE_URL,
    });
    expect(mockTicketsCreate).not.toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/support");
    // The PSA id is not a portal ticket id, so the action suppresses the
    // portal detail link instead of producing a broken URL.
    expect(result).toEqual({ ok: true, ticketId: "", subject: "Test ticket" });
  });

  it("returns an error and never falls back to Supabase when Alga rejects the ticket", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockGetAlgaPsaIntakeConfig.mockReturnValue({
      baseUrl: "https://psa.example.test/api/v1",
      apiKey: "test-api-key",
      clientId: "11111111-1111-4111-8111-111111111111",
      boardId: "22222222-2222-4222-8222-222222222222",
      statusId: "33333333-3333-4333-8333-333333333333",
      priorityId: "44444444-4444-4444-8444-444444444444",
    });
    mockCreateIntakeTicket.mockRejectedValue(
      new Error("Alga PSA rejected ticket intake (HTTP 422 system_not_found)."),
    );

    const { createPortalTicket } = await import("@/app/(portal)/portal/support/actions");

    const formData = new FormData();
    formData.set("subject", "Test");

    const result = await createPortalTicket(formData);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("No ticket was created");
    expect(mockTicketsCreate).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
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
