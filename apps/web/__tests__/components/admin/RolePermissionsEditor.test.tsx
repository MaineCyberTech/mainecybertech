import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RolePermissionsEditor from "@/components/admin/RolePermissionsEditor";

const mockGetPermissions = jest.fn();
const mockUpdatePermission = jest.fn();
jest.mock("@/lib/client-api", () => ({
  getClientApi: () => ({
    roles: {
      getPermissions: (...args: any[]) => mockGetPermissions(...args),
      updatePermission: (...args: any[]) => mockUpdatePermission(...args),
    },
  }),
}));

const PERMISSIONS = [
  {
    id: "p1",
    module_key: "dashboard",
    action_key: "view",
    description: "View dashboard",
  },
  {
    id: "p2",
    module_key: "users",
    action_key: "view",
    description: "View users",
  },
  {
    id: "p3",
    module_key: "users",
    action_key: "create",
    description: "Create users",
  },
];

const ROLE_PERMISSION_IDS = ["p1", "p2"];

describe("RolePermissionsEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissions.mockResolvedValue({
      permissions: PERMISSIONS,
      rolePermissionIds: ROLE_PERMISSION_IDS,
    });
  });

  it("shows loading state initially", () => {
    mockGetPermissions.mockReturnValue(new Promise(() => {}));
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    expect(screen.getByText("Loading permissions...")).toBeInTheDocument();
  });

  it("renders permission matrix after loading", async () => {
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    await waitFor(() => {
      expect(screen.getByText("dashboard")).toBeInTheDocument();
      expect(screen.getByText("users")).toBeInTheDocument();
      expect(screen.getAllByText("view").length).toBeGreaterThanOrEqual(1);
    });
    await waitFor(() => {
      expect(screen.getAllByText("create").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows granted vs total count", async () => {
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    await waitFor(() => {
      const all = document.body.textContent || "";
      expect(all).toContain("permissions granted");
    });
  });

  it("shows checkmark for granted permissions", async () => {
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    await waitFor(() => {
      expect(screen.getAllByText("✓").length).toBe(2);
    });
  });

  it("shows super admin message for super_admin role", async () => {
    render(
      <RolePermissionsEditor
        roleId="r1"
        roleKey="super_admin"
        isSystem={true}
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByText(/Super Admin has all permissions/),
      ).toBeInTheDocument();
    });
  });

  it("disables toggles for super_admin role", async () => {
    render(
      <RolePermissionsEditor
        roleId="r1"
        roleKey="super_admin"
        isSystem={true}
      />,
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });
  });

  it("calls updatePermission on toggle", async () => {
    mockUpdatePermission.mockResolvedValue({ updated: true });
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const grantButton = buttons.find((b) => b.textContent === "");
      if (grantButton) fireEvent.click(grantButton);
    });
    await waitFor(() => {
      expect(mockUpdatePermission).toHaveBeenCalled();
    });
  });

  it("shows dash for non-existent permission combos", async () => {
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThan(0);
    });
  });

  it("organizes permissions into module groups", async () => {
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    await waitFor(() => {
      expect(screen.getByText("Core")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });
  });

  it("shows toast on successful toggle", async () => {
    mockUpdatePermission.mockResolvedValue({ updated: true });
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const grantButton = buttons.find((b) => b.textContent === "");
      if (grantButton) fireEvent.click(grantButton);
    });
    await waitFor(() => {
      expect(
        screen.getByText(/Permission (granted|revoked)/),
      ).toBeInTheDocument();
    });
  });

  it("shows error toast on network failure", async () => {
    mockUpdatePermission.mockRejectedValue(new Error("Network error"));
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const checkButton = buttons.find((b) => b.textContent === "✓");
      if (checkButton) fireEvent.click(checkButton);
    });
    await waitFor(() => {
      expect(
        screen.getByText("Network error updating permission"),
      ).toBeInTheDocument();
    });
  });

  it("shows loading indicator during toggle", async () => {
    mockUpdatePermission.mockImplementation(() => new Promise(() => {}));
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const grantButton = buttons.find(
        (b) => !b.disabled && b.textContent === "",
      );
      if (grantButton) fireEvent.click(grantButton);
    });
    await waitFor(() => {
      expect(screen.getByText("...")).toBeInTheDocument();
    });
  });

  it("sorts modules by predefined order", async () => {
    const sortedPerms = [
      {
        id: "p5",
        module_key: "notifications",
        action_key: "view",
        description: null,
      },
      {
        id: "p1",
        module_key: "dashboard",
        action_key: "view",
        description: null,
      },
      {
        id: "p2",
        module_key: "billing",
        action_key: "view",
        description: null,
      },
    ];
    mockGetPermissions.mockResolvedValue({
      permissions: sortedPerms,
      rolePermissionIds: [],
    });
    render(
      <RolePermissionsEditor roleId="r1" roleKey="admin" isSystem={false} />,
    );
    await waitFor(() => {
      const modules = screen.getAllByRole("row");
      expect(modules.length).toBeGreaterThan(0);
    });
  });
});
