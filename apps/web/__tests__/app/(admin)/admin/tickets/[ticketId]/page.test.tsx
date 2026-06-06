import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const mockTicketsGet = jest.fn();
const mockOrgsGet = jest.fn();
const mockTicketsListComments = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    tickets: { get: mockTicketsGet, listComments: mockTicketsListComments, update: jest.fn(), addComment: jest.fn() },
    organizations: { get: mockOrgsGet },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/components/admin/AdminBreadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.map((i: any) => i.label).join(" > ")}</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

const baseTicket = {
  id: "t1", title: "Login Issue", subject: "Login Issue", description: "Cannot log in",
  organization_id: "o1", status: "open", priority: "high", category: "bug",
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
};

describe("AdminTicketDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockTicketsGet.mockResolvedValue(baseTicket);
    mockOrgsGet.mockResolvedValue({ id: "o1", name: "Acme Corp" });
    mockTicketsListComments.mockResolvedValue([]);
  });

  it("renders ticket not found error", async () => {
    mockTicketsGet.mockRejectedValue(new Error("not found"));
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "bad" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Ticket not found.")).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent("Login Issue");
    expect(screen.getByTestId("subnav")).toHaveTextContent("tickets");
  });

  it("renders ticket title, org, and ID", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Login Issue")).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes("Acme Corp"))).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes("Ticket ID: t1"))).toBeInTheDocument();
  });

  it("shows status and priority pills", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByText("open")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("shows edit and delete buttons in view mode", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Edit Ticket")).toBeInTheDocument();
    expect(screen.getByText("Delete Ticket")).toBeInTheDocument();
    expect(screen.getByText("Back to Tickets")).toBeInTheDocument();
  });

  it("shows ticket details section in view mode", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Ticket Details")).toBeInTheDocument();
    expect(screen.getByText("bug")).toBeInTheDocument();
    expect(screen.getByText("Cannot log in")).toBeInTheDocument();
  });

  it("shows edit form in edit mode", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({ edit: "1" }) }));
    expect(screen.getByText("Edit Ticket")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.getByText("Cancel Edit")).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes("Title"))).toBeInTheDocument();
  });

  it("shows delete confirmation in confirmDelete mode", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({ confirmDelete: "1" }) }));
    expect(screen.getByText("Confirm Ticket Deletion")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
  });

  it("shows restore button for deleted tickets", async () => {
    mockTicketsGet.mockResolvedValue({ ...baseTicket, title: "[Deleted] Login Issue", is_deleted: true });
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Restore Ticket")).toBeInTheDocument();
    expect(screen.queryByText("Delete Ticket")).not.toBeInTheDocument();
  });

  it("shows comments section with empty state", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Comments")).toBeInTheDocument();
    expect(screen.getByText("No comments yet.")).toBeInTheDocument();
  });

  it("shows comments list with author and internal badge", async () => {
    mockTicketsListComments.mockResolvedValue([{ id: "c1", body: "Checking this", author_name: "Admin User", is_internal: true, created_at: new Date().toISOString() }]);
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("Internal")).toBeInTheDocument();
    expect(screen.getByText("Checking this")).toBeInTheDocument();
  });

  it("shows add comment form", async () => {
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByPlaceholderText(/Add an admin note/)).toBeInTheDocument();
    expect(screen.getByText("Post Comment")).toBeInTheDocument();
    expect(screen.getByText("Internal only")).toBeInTheDocument();
  });

  it("shows org fallback to ID when org not found", async () => {
    mockOrgsGet.mockRejectedValue(new Error("not found"));
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByText((c) => c.includes("o1"))).toBeInTheDocument();
  });

  it("strips deleted prefix from title display", async () => {
    mockTicketsGet.mockResolvedValue({ ...baseTicket, title: "[Deleted] Old Issue", is_deleted: true });
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Old Issue")).toBeInTheDocument();
    expect(screen.queryByText("[Deleted] Old Issue")).not.toBeInTheDocument();
  });

  it("does not show delete confirm section when ticket is deleted", async () => {
    mockTicketsGet.mockResolvedValue({ ...baseTicket, is_deleted: true });
    const Page = (await import("@/app/(admin)/admin/tickets/[ticketId]/page")).default;
    render(await Page({ params: Promise.resolve({ ticketId: "t1" }), searchParams: Promise.resolve({ confirmDelete: "1" }) }));
    expect(screen.queryByText("Confirm Ticket Deletion")).not.toBeInTheDocument();
  });
});
