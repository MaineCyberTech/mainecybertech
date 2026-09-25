import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockRequirePermission = jest.fn();
jest.mock("@/lib/auth/permissions", () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
}));

const mockGetCompound = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    users: { getCompound: mockGetCompound },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("@/lib/client-api", () => ({
  getClientApi: () => ({
    organizations: { list: jest.fn().mockResolvedValue({ items: [], total: 0 }) },
    roles: { list: jest.fn().mockResolvedValue([]) },
    memberships: { invite: jest.fn() },
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

const COMPOUND_ALICE = {
  user: { id: "u1", full_name: "Alice Smith", email: "alice@test.com" },
  profile: { id: "u1", full_name: "Alice Smith", email: "alice@test.com" },
  memberships: [
    {
      id: "m1",
      user_id: "u1",
      organization_id: "o1",
      role_id: "r1",
      status: "approved",
      is_billing_contact: false,
      is_security_contact: false,
    },
  ],
  organizations: [{ id: "o1", name: "Acme Corp" }],
  roles: [{ id: "r1", name: "Admin" }],
  allRoles: [],
};

describe("UsersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockGetCompound.mockResolvedValue([]);
  });

  it("renders page shell with title and description", async () => {
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByText(/Manage user profiles/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("users");
  });

  it("shows user count (unique users)", async () => {
    mockGetCompound.mockResolvedValue([COMPOUND_ALICE]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("Total users: 1")).toBeInTheDocument();
  });

  it("renders empty state when no users", async () => {
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("No users found.")).toBeInTheDocument();
  });

  it("renders user cards with profile and org info", async () => {
    mockGetCompound.mockResolvedValue([COMPOUND_ALICE]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    expect(screen.getAllByText(/Acme Corp/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Admin/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows multi-org indicator for users in multiple orgs", async () => {
    mockGetCompound.mockResolvedValue([
      {
        user: { id: "u1", full_name: "Alice", email: "alice@test.com" },
        profile: { id: "u1", full_name: "Alice", email: "alice@test.com" },
        memberships: [
          {
            id: "m1",
            user_id: "u1",
            organization_id: "o1",
            role_id: "r1",
            status: "approved",
            is_billing_contact: false,
            is_security_contact: false,
          },
          {
            id: "m2",
            user_id: "u1",
            organization_id: "o2",
            role_id: "r2",
            status: "approved",
            is_billing_contact: false,
            is_security_contact: false,
          },
        ],
        organizations: [
          { id: "o1", name: "Acme" },
          { id: "o2", name: "BetaCo" },
        ],
        roles: [
          { id: "r1", name: "Admin" },
          { id: "r2", name: "Viewer" },
        ],
        allRoles: [],
      },
    ]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getAllByText(/1 more org/).length).toBeGreaterThanOrEqual(1);
  });

  it("renders super admin badge for super admins", async () => {
    mockGetCompound.mockResolvedValue([
      {
        ...COMPOUND_ALICE,
        user: { id: "u1", full_name: "Admin", email: "admin@test.com", is_super_admin: true },
        profile: { id: "u1", full_name: "Admin", email: "admin@test.com", is_super_admin: true },
      },
    ]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("renders billing contact badge", async () => {
    mockGetCompound.mockResolvedValue([
      {
        ...COMPOUND_ALICE,
        memberships: [
          {
            id: "m1",
            user_id: "u1",
            organization_id: "o1",
            role_id: "r1",
            status: "approved",
            is_billing_contact: true,
            is_security_contact: false,
          },
        ],
      },
    ]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("Billing Contact")).toBeInTheDocument();
  });

  it("links membership cards to user detail page", async () => {
    mockGetCompound.mockResolvedValue([COMPOUND_ALICE]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    const link = screen.getByText("Alice Smith").closest("a");
    expect(link).toHaveAttribute("href", "/admin/users/u1");
  });

  it("handles unknown profile gracefully", async () => {
    mockGetCompound.mockResolvedValue([
      {
        user: { id: "u-missing" },
        profile: { id: "u-missing" },
        memberships: [
          {
            id: "m1",
            user_id: "u-missing",
            organization_id: "o1",
            role_id: null,
            status: "pending",
            is_billing_contact: false,
            is_security_contact: false,
          },
        ],
        organizations: [{ id: "o1", name: "Acme" }],
        roles: [],
        allRoles: [],
      },
    ]);
    const UsersPage = (await import("@/app/(admin)/admin/users/page")).default;
    render(await UsersPage());
    expect(screen.getByText("Unknown User")).toBeInTheDocument();
    expect(screen.getByText("No email")).toBeInTheDocument();
  });
});
