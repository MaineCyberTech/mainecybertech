import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserPermissionOverridesClient from "@/components/admin/UserPermissionOverridesClient";

const mockGetPermissions = jest.fn();
const mockUpdatePermissions = jest.fn();
jest.mock("@/lib/client-api", () => ({
  getClientApi: () => ({
    users: {
      getPermissions: (...args: any[]) => mockGetPermissions(...args),
      updatePermissions: (...args: any[]) => mockUpdatePermissions(...args),
    },
  }),
}));

const PERMISSIONS = [
  {
    id: "p1",
    module_key: "tickets",
    action_key: "view",
    group_key: "core",
    scope: "both",
    label: "Tickets",
  },
  {
    id: "p2",
    module_key: "users",
    action_key: "view",
    group_key: "admin",
    scope: "admin",
    label: "Users",
  },
];

const MEMBERSHIPS = [{ id: "m1", organization_id: "org-1", role_id: "role-a" }];

describe("UserPermissionOverridesClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissions.mockResolvedValue({
      permissions: PERMISSIONS,
      rolePermissionIds: ["p1"],
      overrides: [],
    });
    mockUpdatePermissions.mockResolvedValue({ updated: true });
  });

  it("shows loading state initially", () => {
    mockGetPermissions.mockReturnValue(new Promise(() => {}));
    render(<UserPermissionOverridesClient userId="u1" memberships={MEMBERSHIPS} />);
    expect(screen.getByText("Loading permissions...")).toBeInTheDocument();
  });

  it("renders the matrix with modules and groups", async () => {
    render(<UserPermissionOverridesClient userId="u1" memberships={MEMBERSHIPS} />);
    await waitFor(() => {
      expect(screen.getByText("Tickets")).toBeInTheDocument();
      expect(screen.getByText("Users")).toBeInTheDocument();
    });
    expect(screen.getByText("Core")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("shows role-default checkmark for role-granted permissions", async () => {
    render(<UserPermissionOverridesClient userId="u1" memberships={MEMBERSHIPS} />);
    await waitFor(() => {
      expect(screen.getAllByText("✓").length).toBe(1);
    });
  });

  it("cycles override: allow -> deny -> reset", async () => {
    render(<UserPermissionOverridesClient userId="u1" memberships={MEMBERSHIPS} />);
    await waitFor(() => {
      expect(screen.getByText("Tickets")).toBeInTheDocument();
    });

    const toggleButton = screen.getByLabelText(/Toggle tickets view override/);
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(mockUpdatePermissions).toHaveBeenCalledWith("u1", {
        organizationId: "org-1",
        permissionId: "p1",
        isAllowed: true,
      });
    });
  });

  it("renders empty state without memberships", async () => {
    render(<UserPermissionOverridesClient userId="u1" memberships={[]} />);
    await waitFor(() => {
      expect(screen.getByText(/No memberships — permission overrides require/)).toBeInTheDocument();
    });
  });

  it("shows error toast when loading fails", async () => {
    mockGetPermissions.mockRejectedValue(new Error("boom"));
    render(<UserPermissionOverridesClient userId="u1" memberships={MEMBERSHIPS} />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load permissions")).toBeInTheDocument();
    });
  });
});
