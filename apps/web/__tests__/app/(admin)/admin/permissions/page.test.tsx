import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockRequirePermission = jest.fn();
jest.mock("@/lib/auth/permissions", () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
}));

const mockRolesList = jest.fn();
const mockRolesGetPermissions = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    roles: {
      list: mockRolesList,
      getPermissions: mockRolesGetPermissions,
    },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const ROLES = [
  { id: "r1", key: "super_admin", name: "Super Admin", description: null, is_system: true },
  { id: "r2", key: "client_user", name: "Client User", description: null, is_system: true },
];

const PERMISSION_RESPONSE = {
  role: { id: "r1", key: "super_admin", name: "Super Admin" },
  permissions: [
    {
      id: "p1",
      module_key: "dashboard",
      action_key: "view",
      group_key: "core",
      scope: "both",
      label: "Dashboard",
    },
    {
      id: "p2",
      module_key: "tickets",
      action_key: "view",
      group_key: "core",
      scope: "both",
      label: "Tickets",
    },
    {
      id: "p3",
      module_key: "tickets",
      action_key: "create",
      group_key: "core",
      scope: "both",
      label: "Tickets",
    },
    {
      id: "p4",
      module_key: "users",
      action_key: "view",
      group_key: "admin",
      scope: "admin",
      label: "Users",
    },
  ],
  rolePermissionIds: ["p1", "p2", "p3"],
};

describe("PermissionMatrixPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockRequirePermission.mockResolvedValue({
      isSuperAdmin: false,
      keys: [],
      permissions: [],
      roles: [],
    });
    mockRolesList.mockResolvedValue(ROLES);
    mockRolesGetPermissions.mockResolvedValue(PERMISSION_RESPONSE);
  });

  it("gates the page behind admin + roles permission", async () => {
    const Page = (await import("@/app/(admin)/admin/permissions/page")).default;
    await Page();
    expect(mockRequireAdminAccess).toHaveBeenCalled();
    expect(mockRequirePermission).toHaveBeenCalledWith("roles", "view");
  });

  it("renders the matrix with role columns", async () => {
    const Page = (await import("@/app/(admin)/admin/permissions/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Permission Matrix" })).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
    expect(screen.getByText("Client User")).toBeInTheDocument();
  });

  it("shows checkmarks for granted view permissions", async () => {
    const Page = (await import("@/app/(admin)/admin/permissions/page")).default;
    render(await Page());
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Tickets")).toBeInTheDocument();
    expect(screen.getAllByText("✓").length).toBeGreaterThanOrEqual(3);
  });

  it("renders group headers", async () => {
    const Page = (await import("@/app/(admin)/admin/permissions/page")).default;
    render(await Page());
    expect(screen.getByText("Core")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("shows empty state when the matrix cannot load", async () => {
    mockRolesList.mockRejectedValue(new Error("boom"));
    const Page = (await import("@/app/(admin)/admin/permissions/page")).default;
    render(await Page());
    expect(screen.getByText(/Unable to load the permission matrix/)).toBeInTheDocument();
  });
});
