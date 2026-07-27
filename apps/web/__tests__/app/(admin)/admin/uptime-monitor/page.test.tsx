import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockUptimeMonitorListChecks = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    uptimeMonitor: { listChecks: mockUptimeMonitorListChecks },
  }),
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mocks.requireAdminAccess(...args),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

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

describe("UptimeMonitorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockUptimeMonitorListChecks.mockResolvedValue({ items: [] });
  });

  it("renders page shell with heading 'Uptime Monitor'", async () => {
    const Page = (await import("@/app/(admin)/admin/uptime-monitor/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Uptime Monitor" })).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/uptime-monitor/page")).default;
    render(await Page());
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs", async () => {
    const Page = (await import("@/app/(admin)/admin/uptime-monitor/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
  });

  it("shows 'Add Monitor' button", async () => {
    const Page = (await import("@/app/(admin)/admin/uptime-monitor/page")).default;
    render(await Page());
    expect(screen.getAllByText("Add Monitor").length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/uptime-monitor/page")).default;
    render(await Page());
    expect(screen.getByText("No monitors configured")).toBeInTheDocument();
  });

  it("renders list items with URL and status when data exists", async () => {
    mockUptimeMonitorListChecks.mockResolvedValue({
      items: [
        {
          id: "1",
          url: "https://example.com",
          check_type: "HTTP",
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/uptime-monitor/page")).default;
    render(await Page());
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
    expect(screen.getByText(/HTTP/)).toBeInTheDocument();
  });
});
