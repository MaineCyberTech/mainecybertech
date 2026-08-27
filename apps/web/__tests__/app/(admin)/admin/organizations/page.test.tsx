import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
const mockRequirePermission = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));
jest.mock("@/lib/auth/permissions", () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
}));

const mockOrganizationsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { list: mockOrganizationsList },
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

jest.mock("@/components/admin/AdminOrganizationsClient", () => {
  return function MockAdminOrganizationsClient({ organizations }: any) {
    return (
      <div data-testid="orgs">
        {organizations.map((o: any) => (
          <span key={o.id}>{o.name}</span>
        ))}
      </div>
    );
  };
});

jest.mock("@/components/admin/CreateOrganizationForm", () => {
  return function MockCreateOrganizationForm() {
    return <div data-testid="create-form" />;
  };
});

jest.mock("@/components/admin/AdminPagination", () => {
  return function MockAdminPagination() {
    return <nav data-testid="pagination" />;
  };
});

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("OrganizationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue(undefined);
    mockOrganizationsList.mockResolvedValue({ items: [], total: 0 });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { name: "Organizations" })).toBeInTheDocument();
    expect(
      screen.getByText(/View and manage client tenants, domains, status, and service plans\./),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("organizations");
  });

  it("renders organizations list when orgs exist", async () => {
    mockOrganizationsList.mockResolvedValue({
      items: [{ id: "o1", name: "Acme Corp" }],
      total: 1,
    });
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("calls requireAdminAccess and requirePermission", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(mockRequireAdminAccess).toHaveBeenCalled();
    expect(mockRequirePermission).toHaveBeenCalledWith("organizations", "view");
  });

  it("handles API error gracefully", async () => {
    mockOrganizationsList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("orgs")).toBeInTheDocument();
  });
});
