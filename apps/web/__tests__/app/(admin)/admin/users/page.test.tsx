import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockMembershipsList = jest.fn();
const mockProfilesList = jest.fn();
const mockOrgsList = jest.fn();
const mockRolesList = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    memberships: { list: mockMembershipsList },
    profiles: { list: mockProfilesList },
    organizations: { list: mockOrgsList },
    roles: { list: mockRolesList },
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

describe("UsersPage", () => {
  beforeAll(async () => {
    jest.isolateModules(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
  });

  it("renders page shell with title and description", async () => {
    mockMembershipsList.mockResolvedValue([]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByText(/Manage user profiles/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    mockMembershipsList.mockResolvedValue([]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("users");
  });

  it("shows user count (unique users)", async () => {
    mockMembershipsList.mockResolvedValue([
      { id: "m1", user_id: "u1", organization_id: "o1", role_id: "r1" },
      { id: "m2", user_id: "u1", organization_id: "o2", role_id: "r1" },
    ]);
    mockProfilesList.mockResolvedValue([]);
    mockOrgsList.mockResolvedValue([]);
    mockRolesList.mockResolvedValue([]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("Total users: 1")).toBeInTheDocument();
  });

  it("renders empty state when no memberships", async () => {
    mockMembershipsList.mockResolvedValue([]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("No users found.")).toBeInTheDocument();
  });

  it("renders user cards with profile and org info", async () => {
    mockMembershipsList.mockResolvedValue([
      {
        id: "m1",
        user_id: "u1",
        organization_id: "o1",
        role_id: "r1",
        status: "approved",
      },
    ]);
    mockProfilesList.mockResolvedValue([
      { id: "u1", full_name: "Alice Smith", email: "alice@test.com" },
    ]);
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme Corp" }]);
    mockRolesList.mockResolvedValue([{ id: "r1", name: "Admin" }]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    expect(screen.getAllByText(/Acme Corp/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Admin/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows multi-org indicator for users in multiple orgs", async () => {
    mockMembershipsList.mockResolvedValue([
      {
        id: "m1",
        user_id: "u1",
        organization_id: "o1",
        role_id: "r1",
        status: "approved",
      },
      {
        id: "m2",
        user_id: "u1",
        organization_id: "o2",
        role_id: "r2",
        status: "approved",
      },
    ]);
    mockProfilesList.mockResolvedValue([
      { id: "u1", full_name: "Alice", email: "alice@test.com" },
    ]);
    mockOrgsList.mockResolvedValue([
      { id: "o1", name: "Acme" },
      { id: "o2", name: "BetaCo" },
    ]);
    mockRolesList.mockResolvedValue([
      { id: "r1", name: "Admin" },
      { id: "r2", name: "Viewer" },
    ]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getAllByText(/1 more org/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders super admin badge for super admins", async () => {
    mockMembershipsList.mockResolvedValue([
      {
        id: "m1",
        user_id: "u1",
        organization_id: "o1",
        role_id: "r1",
        status: "approved",
      },
    ]);
    mockProfilesList.mockResolvedValue([
      {
        id: "u1",
        full_name: "Admin",
        email: "admin@test.com",
        is_super_admin: true,
      },
    ]);
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme" }]);
    mockRolesList.mockResolvedValue([{ id: "r1", name: "Admin" }]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("renders billing contact badge", async () => {
    mockMembershipsList.mockResolvedValue([
      {
        id: "m1",
        user_id: "u1",
        organization_id: "o1",
        role_id: "r1",
        status: "approved",
        is_billing_contact: true,
      },
    ]);
    mockProfilesList.mockResolvedValue([
      { id: "u1", full_name: "Bill", email: "bill@test.com" },
    ]);
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme" }]);
    mockRolesList.mockResolvedValue([{ id: "r1", name: "Admin" }]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("Billing Contact")).toBeInTheDocument();
  });

  it("links membership cards to user detail page", async () => {
    mockMembershipsList.mockResolvedValue([
      {
        id: "m1",
        user_id: "u1",
        organization_id: "o1",
        role_id: "r1",
        status: "approved",
      },
    ]);
    mockProfilesList.mockResolvedValue([
      { id: "u1", full_name: "Alice", email: "a@a.com" },
    ]);
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme" }]);
    mockRolesList.mockResolvedValue([{ id: "r1", name: "Admin" }]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    const link = screen.getByText("Alice").closest("a");
    expect(link).toHaveAttribute("href", "/admin/users/u1");
  });

  it("handles unknown profile gracefully", async () => {
    mockMembershipsList.mockResolvedValue([
      {
        id: "m1",
        user_id: "u-missing",
        organization_id: "o1",
        role_id: null,
        status: "pending",
      },
    ]);
    mockProfilesList.mockResolvedValue([]);
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme" }]);
    mockRolesList.mockResolvedValue([]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("Unknown User")).toBeInTheDocument();
    expect(screen.getByText("No email")).toBeInTheDocument();
  });
});
