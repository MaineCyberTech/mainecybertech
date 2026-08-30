import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockQbrList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    qbr: { list: mockQbrList },
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

describe("QbrPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockQbrList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/qbr/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "QBR Executive Reports" })).toBeInTheDocument();
    expect(screen.getByText(/Generate monthly\/quarterly reports/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/qbr/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("qbr");
  });

  it("renders generate report link", async () => {
    const Page = (await import("@/app/(admin)/admin/qbr/page")).default;
    render(await Page());
    const links = screen.getAllByRole("link", { name: "Generate Report" });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/admin/qbr/new");
  });

  it("renders empty state when no reports", async () => {
    const Page = (await import("@/app/(admin)/admin/qbr/page")).default;
    render(await Page());
    expect(screen.getByText("No QBR reports yet")).toBeInTheDocument();
  });

  it("renders reports list when reports exist", async () => {
    mockQbrList.mockResolvedValue({
      items: [
        { id: "q1", title: "Q1 2026 Review", status: "draft", period_start: "2026-01-01", created_at: "2026-04-01T00:00:00Z" },
        { id: "q2", title: "Q2 2026 Review", status: "published", period_start: "2026-04-01", created_at: "2026-07-01T00:00:00Z" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/qbr/page")).default;
    render(await Page());
    expect(screen.getByText("Q1 2026 Review")).toBeInTheDocument();
    expect(screen.getByText("Q2 2026 Review")).toBeInTheDocument();
  });

  it("shows date range for reports with period_start", async () => {
    mockQbrList.mockResolvedValue({
      items: [
        { id: "q1", title: "Q1 Review", status: "draft", period_start: "2026-01-01", created_at: "2026-04-01T00:00:00Z" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/qbr/page")).default;
    render(await Page());
    expect(screen.getByText(/2026-01-01/)).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/qbr/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockQbrList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/qbr/page")).default;
    render(await Page());
    expect(screen.getByText("No QBR reports yet")).toBeInTheDocument();
  });
});
