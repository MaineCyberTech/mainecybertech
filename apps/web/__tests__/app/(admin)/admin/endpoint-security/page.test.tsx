import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockEndpointsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    securitySuite: { endpoints: { list: mockEndpointsList } },
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

jest.mock("@/components/EmptyState", () => {
  return function MockEmptyState({ title, description }: any) {
    return (
      <div data-testid="empty-state">
        <p>{title}</p>
        <p>{description}</p>
      </div>
    );
  };
});

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crud-form">{title}</div>;
  };
});

jest.mock("@/lib/module-actions", () => ({
  createEndpoint: jest.fn(),
}));

describe("AdminEndpointSecurityPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockEndpointsList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/endpoint-security/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Endpoint Security Coverage Map" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Track endpoint protection/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/endpoint-security/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("endpoint-security");
  });

  it("shows empty state when no endpoint groups", async () => {
    const Page = (await import("@/app/(admin)/admin/endpoint-security/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No endpoint groups")).toBeInTheDocument();
  });

  it("renders crud form for new endpoint group", async () => {
    const Page = (await import("@/app/(admin)/admin/endpoint-security/page")).default;
    render(await Page());
    expect(screen.getByTestId("crud-form")).toHaveTextContent("New Endpoint Group");
  });

  it("renders device group items with coverage", async () => {
    mockEndpointsList.mockResolvedValue({
      items: [
        {
          id: "e1",
          device_group: "Workstations",
          total_endpoints: 50,
          av_installed: 48,
          disk_encrypted: 45,
          mdm_enrolled: 50,
          coverage_pct: 96,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/endpoint-security/page")).default;
    render(await Page());
    expect(screen.getByText("Workstations")).toBeInTheDocument();
  });
});
