import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockBusinessOsSummary = jest.fn();
const mockApprovalsOverdue = jest.fn();
const mockRecentActivity = jest.fn();
const mockOrgHealth = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    dashboard: {
      businessOsSummary: mockBusinessOsSummary,
      approvalsOverdue: mockApprovalsOverdue,
      recentActivity: mockRecentActivity,
      orgHealth: mockOrgHealth,
    },
  }),
}));

jest.mock("@/components/Breadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const emptySummary = {
  organizations: { total: 0, approved: 0, pending: 0, recent: [] },
  tickets: { open: 0 },
  projects: { active: 0 },
  documents: { total: 0 },
  approvals: { pending: 0 },
  users: { total: 0 },
};

describe("BusinessOsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockBusinessOsSummary.mockResolvedValue(emptySummary);
    mockApprovalsOverdue.mockResolvedValue({ items: [], total: 0 });
    mockRecentActivity.mockResolvedValue([]);
    mockOrgHealth.mockResolvedValue([]);
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Business OS Dashboard" })).toBeInTheDocument();
    expect(screen.getByText(/Private operating dashboard/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("business-os");
  });

  it("renders six summary stat cards", async () => {
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("Organizations")).toBeInTheDocument();
    expect(screen.getByText("Open Tickets")).toBeInTheDocument();
    expect(screen.getByText("Active Projects")).toBeInTheDocument();
    expect(screen.getByText("Documents")).toBeInTheDocument();
    expect(screen.getByText("Pending Approvals")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("renders overdue approvals section", async () => {
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("Overdue Approvals")).toBeInTheDocument();
  });

  it("renders platform activity section", async () => {
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("Platform Activity")).toBeInTheDocument();
  });

  it("renders organization health section", async () => {
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("Organization Health")).toBeInTheDocument();
  });

  it("renders recent organizations section", async () => {
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("Recent Organizations")).toBeInTheDocument();
  });

  it("shows overdue approvals when present", async () => {
    mockApprovalsOverdue.mockResolvedValue({
      items: [{ id: "a1", request_subject: "Pending QBR Signoff", request_type: "approval", due_at: "2026-06-01T00:00:00Z" }],
      total: 1,
    });
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("Pending QBR Signoff")).toBeInTheDocument();
  });

  it("shows org health entries when present", async () => {
    mockOrgHealth.mockResolvedValue([
      { id: "o1", name: "Acme Corp", openTickets: 5, activeProjects: 2 },
    ]);
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("5 open tickets")).toBeInTheDocument();
    expect(screen.getByText("2 active projects")).toBeInTheDocument();
  });

  it("shows recent activity when present", async () => {
    mockRecentActivity.mockResolvedValue([
      { id: "e1", action: "ticket.created", created_at: "2026-07-26T00:00:00Z" },
    ]);
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("ticket.created")).toBeInTheDocument();
  });

  it("shows stat card values from summary", async () => {
    mockBusinessOsSummary.mockResolvedValue({
      organizations: { total: 12, approved: 10, pending: 2, recent: [] },
      tickets: { open: 34 },
      projects: { active: 7 },
      documents: { total: 89 },
      approvals: { pending: 3 },
      users: { total: 45 },
    });
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("10 approved, 2 pending")).toBeInTheDocument();
  });

  it("renders empty state for no overdue approvals", async () => {
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("No overdue approvals")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockBusinessOsSummary.mockRejectedValue(new Error("API down"));
    mockApprovalsOverdue.mockRejectedValue(new Error("API down"));
    mockRecentActivity.mockRejectedValue(new Error("API down"));
    mockOrgHealth.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/business-os/page")).default;
    render(await Page());
    expect(screen.getByText("Business OS Dashboard")).toBeInTheDocument();
    expect(screen.getByText("No overdue approvals")).toBeInTheDocument();
  });
});
