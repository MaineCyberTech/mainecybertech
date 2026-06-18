import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockRolesListWithPermissions = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    roles: { listWithPermissions: mockRolesListWithPermissions },
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

describe("AdminRolesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
  });

  it("renders page shell with title and description", async () => {
    mockRolesListWithPermissions.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    expect(screen.getByText("Roles & Permissions")).toBeInTheDocument();
    expect(screen.getByText(/Manage system roles/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    mockRolesListWithPermissions.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("roles");
  });

  it("shows stat cards with role counts", async () => {
    mockRolesListWithPermissions.mockResolvedValue([
      {
        id: "r1",
        key: "admin",
        name: "Admin",
        description: "Admin role",
        is_system: true,
        permissionCount: 10,
      },
      {
        id: "r2",
        key: "user",
        name: "User",
        description: "User role",
        is_system: false,
        permissionCount: 5,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders empty state when no roles", async () => {
    mockRolesListWithPermissions.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    expect(screen.getByText("No roles found.")).toBeInTheDocument();
  });

  it("renders role cards with name and description", async () => {
    mockRolesListWithPermissions.mockResolvedValue([
      {
        id: "r1",
        key: "admin",
        name: "Admin",
        description: "Admin role",
        is_system: true,
        permissionCount: 10,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Admin role")).toBeInTheDocument();
  });

  it("shows permission count per role", async () => {
    mockRolesListWithPermissions.mockResolvedValue([
      {
        id: "r1",
        key: "admin",
        name: "Admin",
        description: null,
        is_system: false,
        permissionCount: 7,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    expect(screen.getByText("7 permissions")).toBeInTheDocument();
  });

  it("shows system badge for system roles", async () => {
    mockRolesListWithPermissions.mockResolvedValue([
      {
        id: "r1",
        key: "admin",
        name: "Admin",
        description: null,
        is_system: true,
        permissionCount: 10,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    const badges = screen.getAllByText("System");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("links each role to its detail page", async () => {
    mockRolesListWithPermissions.mockResolvedValue([
      {
        id: "role-1",
        key: "admin",
        name: "Admin",
        description: null,
        is_system: false,
        permissionCount: 5,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    const links = screen.getAllByRole("link");
    expect(
      links.some((l) => l.getAttribute("href") === "/admin/roles/role-1"),
    ).toBe(true);
  });

  it("handles missing description gracefully", async () => {
    mockRolesListWithPermissions.mockResolvedValue([
      {
        id: "r1",
        key: "user",
        name: "User",
        description: null,
        is_system: false,
        permissionCount: 0,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    expect(screen.getByText("No description")).toBeInTheDocument();
  });

  it("handles multiple roles with correct totals", async () => {
    mockRolesListWithPermissions.mockResolvedValue([
      {
        id: "r1",
        key: "admin",
        name: "Admin",
        description: null,
        is_system: true,
        permissionCount: 10,
      },
      {
        id: "r2",
        key: "manager",
        name: "Manager",
        description: null,
        is_system: false,
        permissionCount: 5,
      },
      {
        id: "r3",
        key: "viewer",
        name: "Viewer",
        description: null,
        is_system: false,
        permissionCount: 3,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("uses listWithPermissions (not N+1)", async () => {
    mockRolesListWithPermissions.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/roles/page")).default;
    render(await Page());
    expect(mockRolesListWithPermissions).toHaveBeenCalledTimes(1);
  });
});
