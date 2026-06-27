import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockOrganizationsList = jest.fn();
const mockSlaMetrics = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { list: mockOrganizationsList },
    sla: { metrics: mockSlaMetrics },
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

jest.mock("@/components/admin/AdminSLAClient", () => {
  return function MockSLAClient({ organizations, initialMetrics }: any) {
    return (
      <div data-testid="sla-client">
        <span data-testid="org-count">{organizations?.length ?? 0}</span>
        <span data-testid="has-metrics">{initialMetrics ? "yes" : "no"}</span>
      </div>
    );
  };
});

describe("AdminSLAPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockOrganizationsList.mockResolvedValue([]);
    mockSlaMetrics.mockResolvedValue(null);
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/sla/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "SLA Tracking" })).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalled();
  });

  it("renders SLA client component", async () => {
    const Page = (await import("@/app/(admin)/admin/sla/page")).default;
    render(await Page());
    expect(screen.getByTestId("sla-client")).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/sla/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("sla");
  });

  it("passes organizations data to client", async () => {
    mockOrganizationsList.mockResolvedValue([{ id: "org1", name: "Test Org" }]);
    const Page = (await import("@/app/(admin)/admin/sla/page")).default;
    render(await Page());
    expect(screen.getByTestId("org-count")).toHaveTextContent("1");
  });

  it("passes initialMetrics data when available", async () => {
    mockSlaMetrics.mockResolvedValue({
      summary: { total: 10, breached: 2, breachedRate: 20, resolved: 8 },
      byMetric: {},
      recent: [],
    });
    const Page = (await import("@/app/(admin)/admin/sla/page")).default;
    render(await Page());
    expect(screen.getByTestId("has-metrics")).toHaveTextContent("yes");
  });
});
