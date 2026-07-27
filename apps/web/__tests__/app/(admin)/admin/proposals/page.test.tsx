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

  it("renders status counts as zero", async () => {
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByText("0 Draft")).toBeInTheDocument();
    expect(screen.getByText("0 Sent")).toBeInTheDocument();
    expect(screen.getByText("0 Approved")).toBeInTheDocument();
  });

  it("renders New Proposal link", async () => {
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByRole("link", { name: "New Proposal" })).toBeInTheDocument();
  });

  it("renders Quick Actions section", async () => {
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText("Select Client")).toBeInTheDocument();
    expect(screen.getByText("Approval Queue")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("renders empty state when no proposals", async () => {
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByText("No proposals yet")).toBeInTheDocument();
  });

  it("renders proposals list when proposals exist", async () => {
    mockProposalsList.mockResolvedValue({
      items: [
        { id: "p1", title: "Security Audit Proposal", status: "draft", grand_total: 5000, created_at: "2026-07-01T00:00:00Z" },
        { id: "p2", title: "MSP Onboarding", status: "sent", grand_total: 12000, created_at: "2026-07-15T00:00:00Z" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByText("Security Audit Proposal")).toBeInTheDocument();
    expect(screen.getByText("MSP Onboarding")).toBeInTheDocument();
  });

  it("shows correct status counts when proposals loaded", async () => {
    mockProposalsList.mockResolvedValue({
      items: [
        { id: "p1", title: "Draft 1", status: "draft", grand_total: 100, created_at: "2026-01-01T00:00:00Z" },
        { id: "p2", title: "Draft 2", status: "draft", grand_total: 200, created_at: "2026-01-01T00:00:00Z" },
        { id: "p3", title: "Sent 1", status: "sent", grand_total: 300, created_at: "2026-01-01T00:00:00Z" },
        { id: "p4", title: "Approved 1", status: "approved", grand_total: 400, created_at: "2026-01-01T00:00:00Z" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/proposals/page")).default;
    render(await Page());
    expect(screen.getByText("2 Draft")).toBeInTheDocument();
    expect(screen.getByText("1 Sent")).toBeInTheDocument();
    expect(screen.getByText("1 Approved")).toBeInTheDocument();
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
    expect(screen.getByText("No proposals yet")).toBeInTheDocument();
  });
});
