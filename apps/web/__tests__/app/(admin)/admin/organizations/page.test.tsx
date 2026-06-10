import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockOrgsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { list: mockOrgsList },
  }),
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

describe("OrganizationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
  });

  it("renders page shell with title and description", async () => {
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Organizations" })).toBeInTheDocument();
    expect(screen.getByText(/View and manage client tenants/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("organizations");
  });

  it("renders empty state when no organizations", async () => {
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page());
    expect(screen.getByText("No organizations found.")).toBeInTheDocument();
  });

  it("renders organization cards with details", async () => {
    mockOrgsList.mockResolvedValue([
      { id: "org-1", name: "Acme Corp", slug: "acme", primary_domain: "acme.com", status: "active", support_plan: "premium" },
    ]);
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page());
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText(/acme/)).toBeInTheDocument();
    expect(screen.getByText(/acme\.com/)).toBeInTheDocument();
    expect(screen.getAllByText("active").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("premium")).toBeInTheDocument();
  });

  it("handles null primary_domain", async () => {
    mockOrgsList.mockResolvedValue([
      { id: "org-1", name: "Beta Inc", slug: "beta", primary_domain: null, status: "pending", support_plan: null },
    ]);
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page());
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    expect(screen.getByText(/Domain: —/)).toBeInTheDocument();
    expect(screen.getByText("No Plan")).toBeInTheDocument();
  });

  it("links org cards to detail page", async () => {
    mockOrgsList.mockResolvedValue([
      { id: "org-1", name: "Acme Corp", slug: "acme", status: "active", support_plan: null },
    ]);
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page());
    const link = screen.getByText("Acme Corp").closest("a");
    expect(link).toHaveAttribute("href", "/admin/organizations/org-1");
  });

  it("handles null organizations response", async () => {
    mockOrgsList.mockResolvedValue(null);
    const Page = (await import("@/app/(admin)/admin/organizations/page")).default;
    render(await Page());
    expect(screen.getByText("No organizations found.")).toBeInTheDocument();
  });
});
