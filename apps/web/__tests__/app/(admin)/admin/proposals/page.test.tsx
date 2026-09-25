import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockProposalsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    proposals: { list: mockProposalsList },
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

jest.mock("@/components/EmptyState", () => {
  return function MockEmptyState({ title, actionLabel }: any) {
    return (
      <div data-testid="empty-state">
        {title} {actionLabel}
      </div>
    );
  };
});

jest.mock("@/components/admin/StatusPill", () => ({
  StatusPill: function MockStatusPill({ status }: any) {
    return <span data-testid="status-pill">{status}</span>;
  },
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("ProposalsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockProposalsList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Proposal Builder" })).toBeInTheDocument();
    expect(screen.getByText(/Create and manage MSP proposals/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("proposals");
  });

  it("renders empty state when no proposals", async () => {
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No proposals yet");
  });

  it("renders proposals when they exist", async () => {
    mockProposalsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          title: "Acme Security Package",
          status: "draft",
          grand_total: 5000,
          created_at: "2026-06-01T00:00:00Z",
        },
        {
          id: "p2",
          title: "Beta Compliance Suite",
          status: "sent",
          grand_total: 12000,
          created_at: "2026-06-15T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByText("Acme Security Package")).toBeInTheDocument();
    expect(screen.getByText("Beta Compliance Suite")).toBeInTheDocument();
  });

  it("shows currency totals", async () => {
    mockProposalsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          title: "Test Proposal",
          status: "approved",
          grand_total: 7500,
          created_at: "2026-06-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByText(/\$7,500/)).toBeInTheDocument();
  });

  it("shows draft/sent/approved counts in pills", async () => {
    mockProposalsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          title: "P1",
          status: "draft",
          grand_total: 1000,
          created_at: "2026-06-01T00:00:00Z",
        },
        {
          id: "p2",
          title: "P2",
          status: "draft",
          grand_total: 2000,
          created_at: "2026-06-01T00:00:00Z",
        },
        {
          id: "p3",
          title: "P3",
          status: "sent",
          grand_total: 3000,
          created_at: "2026-06-01T00:00:00Z",
        },
        {
          id: "p4",
          title: "P4",
          status: "approved",
          grand_total: 4000,
          created_at: "2026-06-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByText("2 Draft")).toBeInTheDocument();
    expect(screen.getByText("1 Sent")).toBeInTheDocument();
    expect(screen.getByText("1 Approved")).toBeInTheDocument();
  });

  it("renders quick action links", async () => {
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    const links = screen.getAllByRole("link");
    const quickActionTexts = links.map((l) => l.textContent).join(" ");
    expect(quickActionTexts).toContain("Select Client");
    expect(quickActionTexts).toContain("Approval Queue");
    expect(quickActionTexts).toContain("Projects");
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockProposalsList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No proposals yet");
  });
});
