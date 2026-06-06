import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockOrgsList = jest.fn();
const mockTicketsList = jest.fn();
const mockDocsList = jest.fn();
const mockProjectsList = jest.fn();
const mockMembershipsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { list: mockOrgsList },
    tickets: { list: mockTicketsList },
    documents: { list: mockDocsList },
    projects: { list: mockProjectsList },
    memberships: { list: mockMembershipsList },
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
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

const baseOrgs = [{ id: "o1", name: "Acme Corp" }];
const baseTicket = { id: "t1", subject: "Need help", organization_id: "o1", status: "open", priority: "high", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
const baseDoc = { id: "d1", name: "Report", organization_id: "o1", visibility: "org", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
const baseProject = { id: "p1", name: "Security Audit", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

describe("AdminHomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockOrgsList.mockResolvedValue(baseOrgs);
    mockTicketsList.mockResolvedValue({ items: [baseTicket], total: 1 });
    mockDocsList.mockResolvedValue({ items: [baseDoc], total: 1 });
    mockProjectsList.mockResolvedValue({ items: [baseProject], total: 1 });
    mockMembershipsList.mockResolvedValue([]);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("home");
  });

  it("renders stat cards with correct counts", async () => {
    mockOrgsList.mockResolvedValue([{ id: "o1" }, { id: "o2" }]);
    mockTicketsList.mockResolvedValue({ items: [baseTicket], total: 5 });
    mockDocsList.mockResolvedValue({ items: [baseDoc], total: 3 });
    mockProjectsList.mockResolvedValue({ items: [baseProject], total: 2 });
    mockMembershipsList
      .mockResolvedValueOnce([{ id: "m1", organization_id: "o1", user_id: "u1", status: "pending", created_at: new Date().toISOString() }])
      .mockResolvedValueOnce([{ id: "o2", name: "Pending Org", status: "pending", created_at: new Date().toISOString() }]);
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getAllByText("Organizations").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Tickets").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Documents").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Projects").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pending Approvals").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("5").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  it("shows recent ticket activity", async () => {
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getByText("Recent Support Activity")).toBeInTheDocument();
    expect(screen.getByText("Need help")).toBeInTheDocument();
    expect(screen.getAllByText((c) => c.includes("Org:") && c.includes("Acme Corp")).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Tickets/ })).toBeInTheDocument();
  });

  it("links recent tickets to detail page", async () => {
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    const ticketLink = screen.getByText("Need help").closest("a");
    expect(ticketLink).toHaveAttribute("href", "/admin/tickets/t1");
  });

  it("shows recent document activity", async () => {
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getByText("Recent Document Activity")).toBeInTheDocument();
    expect(screen.getByText("Report")).toBeInTheDocument();
    expect(screen.getByText("org")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Documents/ })).toBeInTheDocument();
  });

  it("shows recent project activity", async () => {
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getByText("Recent Project Activity")).toBeInTheDocument();
    expect(screen.getByText("Security Audit")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Projects/ })).toBeInTheDocument();
  });

  it("shows pending memberships and orgs", async () => {
    mockOrgsList
      .mockResolvedValueOnce(baseOrgs)
      .mockResolvedValueOnce([{ id: "o2", name: "New Org", status: "pending", created_at: new Date().toISOString() }]);
    mockMembershipsList
      .mockResolvedValueOnce([{ id: "m1", organization_id: "o1", user_id: "u1", status: "pending", created_at: new Date().toISOString() }])
      .mockResolvedValueOnce([]);
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getByText("Pending Membership Approvals")).toBeInTheDocument();
    expect(screen.getByText("Pending Organization Requests")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("New Org")).toBeInTheDocument();
  });

  it("shows empty state when no recent activity", async () => {
    mockOrgsList.mockResolvedValue([]);
    mockTicketsList.mockResolvedValue({ items: [], total: 0 });
    mockDocsList.mockResolvedValue({ items: [], total: 0 });
    mockProjectsList.mockResolvedValue({ items: [], total: 0 });
    mockMembershipsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getByText("No recent ticket activity.")).toBeInTheDocument();
    expect(screen.getByText("No recent document activity.")).toBeInTheDocument();
    expect(screen.getByText("No recent project activity.")).toBeInTheDocument();
    expect(screen.getByText("No pending memberships.")).toBeInTheDocument();
    expect(screen.getAllByText((c) => c.includes("No pending organizations")).length).toBeGreaterThanOrEqual(1);
  });

  it("renders quick actions section", async () => {
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText("Approvals")).toBeInTheDocument();
    expect(screen.getAllByText("Organizations").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getAllByText("Tickets").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Documents").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Projects").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Client Portal")).toBeInTheDocument();
  });

  it("renders tickets with resolved status", async () => {
    mockTicketsList.mockResolvedValue({
      items: [{ ...baseTicket, id: "t2", subject: "Resolved ticket", status: "resolved", priority: "normal" }],
      total: 1,
    });
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getByText("Resolved ticket")).toBeInTheDocument();
    expect(screen.getByText("resolved")).toBeInTheDocument();
  });

  it("shows ticket with org fallback to ID", async () => {
    mockTicketsList.mockResolvedValue({
      items: [{ ...baseTicket, id: "t4", subject: "Unknown org ticket", organization_id: "missing-org" }],
      total: 1,
    });
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getByText(/missing-org/)).toBeInTheDocument();
  });

  it("renders stat card descriptions", async () => {
    const Page = (await import("@/app/(admin)/admin/page")).default;
    render(await Page());
    expect(screen.getAllByText("Total customer organizations in the platform.").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Document records across all client organizations.").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Tracked project work across organizations.").length).toBeGreaterThanOrEqual(1);
  });
});
