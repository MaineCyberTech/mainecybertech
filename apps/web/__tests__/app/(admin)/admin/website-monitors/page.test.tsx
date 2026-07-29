import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockWebsiteMonitorsList = jest.fn();
jest.mock("@/lib/api", () => () => ({
  batch: { websiteMonitors: { list: mockWebsiteMonitorsList } },
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

describe("WebsiteMonitorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockWebsiteMonitorsList.mockResolvedValue({ items: [] });
  });

  it("renders page title", async () => {
    const Page = (await import("@/app/(admin)/admin/website-monitors/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: /website uptime & ssl monitor/i }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/website-monitors/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("website-monitors");
  });

  it("shows empty state when no data", async () => {
    const Page = (await import("@/app/(admin)/admin/website-monitors/page")).default;
    render(await Page());
    expect(screen.getByText(/no websites monitored/i)).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockWebsiteMonitorsList.mockResolvedValue({
      items: [
        {
          id: "1",
          url: "https://example.com",
          display_name: "Example Site",
          last_status: "up",
          last_response_ms: 200,
          ssl_valid: true,
          lighthouse_score: 85,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/website-monitors/page")).default;
    render(await Page());
    expect(screen.getByText("Example Site")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/website-monitors/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockWebsiteMonitorsList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/website-monitors/page")).default;
    render(await Page());
    expect(screen.getByText(/no websites monitored/i)).toBeInTheDocument();
  });
});
