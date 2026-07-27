import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockFindingsList = jest.fn();
const mockFindingsStats = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    findings: { list: mockFindingsList, stats: mockFindingsStats },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createFinding: jest.fn(),
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

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crudform">{title}</div>;
  };
});

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const emptyStats = { bySeverity: { p0: 0, p1: 0, p2: 0, p3: 0 }, byStatus: {}, total: 0 };

describe("FindingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockFindingsList.mockResolvedValue({ items: [] });
    mockFindingsStats.mockResolvedValue(emptyStats);
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/findings/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Open Findings & Remediation Tracker" })).toBeInTheDocument();
    expect(screen.getByText(/P0\/P1\/P2\/P3 finding lifecycle/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/findings/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("findings");
  });

  it("renders severity pills showing zero counts", async () => {
    const Page = (await import("@/app/(admin)/admin/findings/page")).default;
    render(await Page());
    expect(screen.getByText("P0: 0")).toBeInTheDocument();
    expect(screen.getByText("P1: 0")).toBeInTheDocument();
    expect(screen.getByText("P2: 0")).toBeInTheDocument();
    expect(screen.getByText("P3: 0")).toBeInTheDocument();
  });

  it("renders CrudForm for new finding", async () => {
    const Page = (await import("@/app/(admin)/admin/findings/page")).default;
    render(await Page());
    expect(screen.getByTestId("crudform")).toHaveTextContent("New Finding");
  });

  it("renders findings count in heading", async () => {
    const Page = (await import("@/app/(admin)/admin/findings/page")).default;
    render(await Page());
    expect(screen.getByText("Findings (0)")).toBeInTheDocument();
  });

  it("renders empty state when no findings", async () => {
    const Page = (await import("@/app/(admin)/admin/findings/page")).default;
    render(await Page());
    expect(screen.getByText("No findings yet")).toBeInTheDocument();
  });

  it("renders findings list when findings exist", async () => {
    mockFindingsList.mockResolvedValue({
      items: [
        { id: "f1", title: "SQL Injection", severity: "p0", status: "open", source: "pentest", remediation_deadline: "2026-08-01", created_at: "2026-06-01T00:00:00Z" },
      ],
    });
    mockFindingsStats.mockResolvedValue({ bySeverity: { p0: 1, p1: 0, p2: 0, p3: 0 }, byStatus: { open: 1 }, total: 1 });
    const Page = (await import("@/app/(admin)/admin/findings/page")).default;
    render(await Page());
    expect(screen.getByText("SQL Injection")).toBeInTheDocument();
    expect(screen.getByText(/pentest/)).toBeInTheDocument();
    expect(screen.getByText("Findings (1)")).toBeInTheDocument();
  });

  it("renders severity count updates when stats returned", async () => {
    mockFindingsStats.mockResolvedValue({ bySeverity: { p0: 1, p1: 2, p2: 3, p3: 4 }, byStatus: {}, total: 10 });
    const Page = (await import("@/app/(admin)/admin/findings/page")).default;
    render(await Page());
    expect(screen.getByText("P0: 1")).toBeInTheDocument();
    expect(screen.getByText("P1: 2")).toBeInTheDocument();
    expect(screen.getByText("P2: 3")).toBeInTheDocument();
    expect(screen.getByText("P3: 4")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/findings/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockFindingsList.mockRejectedValue(new Error("API down"));
    mockFindingsStats.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/findings/page")).default;
    render(await Page());
    expect(screen.getByText("No findings yet")).toBeInTheDocument();
  });
});
