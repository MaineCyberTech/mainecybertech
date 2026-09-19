import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockDomainMonitorsList = jest.fn();
const mockDomainMonitorsStats = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    domainMonitors: {
      list: mockDomainMonitorsList,
      stats: mockDomainMonitorsStats,
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

jest.mock("@/components/EmptyState", () => {
  return function MockEmptyState({ title }: any) {
    return <div data-testid="empty-state">{title}</div>;
  };
});

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crud-form">{title}</div>;
  };
});

jest.mock("@/lib/module-actions", () => ({
  createDomainMonitor: jest.fn(),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("DomainMonitorsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockDomainMonitorsList.mockResolvedValue({ items: [] });
    mockDomainMonitorsStats.mockResolvedValue({
      total: 0,
      sslInvalid: 0,
      sslExpiring: 0,
      spfMissing: 0,
      dkimMissing: 0,
      dmarcMissing: 0,
      nsMismatch: 0,
      notProxied: 0,
    });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/domain-monitors/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "DNS & Domain Health Monitor" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Track SSL, SPF, DKIM/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/domain-monitors/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("domain-monitors");
  });

  it("renders empty state when no domains", async () => {
    const Page = (await import("@/app/(admin)/admin/domain-monitors/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No domains monitored");
  });

  it("shows all clear when no issues", async () => {
    const Page = (await import("@/app/(admin)/admin/domain-monitors/page")).default;
    render(await Page());
    expect(screen.getByText("All clear")).toBeInTheDocument();
  });

  it("shows domain monitor items when they exist", async () => {
    mockDomainMonitorsList.mockResolvedValue({
      items: [
        {
          id: "d1",
          domain: "example.com",
          display_name: "Example",
          ssl_valid: true,
          spf_status: "valid",
          dkim_status: "valid",
          dmarc_status: "valid",
          last_checked_at: "2026-07-01T00:00:00Z",
          dns_provider: "cloudflare",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/domain-monitors/page")).default;
    render(await Page());
    expect(screen.getByText("Example")).toBeInTheDocument();
    expect(screen.getByText(/example.com/)).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("shows stat count in heading", async () => {
    mockDomainMonitorsStats.mockResolvedValue({
      total: 5,
      sslInvalid: 0,
      sslExpiring: 0,
      spfMissing: 0,
      dkimMissing: 0,
      dmarcMissing: 0,
      nsMismatch: 0,
      notProxied: 0,
    });
    const Page = (await import("@/app/(admin)/admin/domain-monitors/page")).default;
    render(await Page());
    expect(screen.getByText(/Monitored Domains/)).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/domain-monitors/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockDomainMonitorsList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/domain-monitors/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No domains monitored");
  });
});
