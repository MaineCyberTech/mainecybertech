import { renderHook, waitFor, act } from "@testing-library/react";
import { usePermissions, invalidatePermissionsCache } from "@/lib/use-permissions";

const mockGetMyPermissions = jest.fn();
jest.mock("@/lib/client-api", () => ({
  getClientApi: () => ({
    permissions: { getMyPermissions: (...args: any[]) => mockGetMyPermissions(...args) },
  }),
}));

const SUPER_ADMIN = {
  isSuperAdmin: true,
  permissions: [{ id: "p1", module_key: "dashboard", action_key: "view" }],
  keys: ["dashboard:view"],
  roles: ["super_admin"],
  memberships: [],
};

const CLIENT_USER = {
  isSuperAdmin: false,
  permissions: [{ id: "p1", module_key: "tickets", action_key: "view" }],
  keys: ["tickets:view"],
  roles: ["client_user"],
  memberships: [{ organization_id: "o1", role_id: "r1", status: "approved" }],
};

describe("usePermissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    invalidatePermissionsCache();
  });

  it("loads permissions and exposes can()", async () => {
    mockGetMyPermissions.mockResolvedValue(CLIENT_USER);
    const { result } = renderHook(() => usePermissions());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isSuperAdmin).toBe(false);
    expect(result.current.can("tickets", "view")).toBe(true);
    expect(result.current.can("tickets", "delete")).toBe(false);
  });

  it("super admins can access everything", async () => {
    mockGetMyPermissions.mockResolvedValue(SUPER_ADMIN);
    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.isSuperAdmin).toBe(true);
    });

    expect(result.current.can("users", "delete")).toBe(true);
    expect(result.current.can("anything", "manage")).toBe(true);
  });

  it("exposes the error when the request fails", async () => {
    mockGetMyPermissions.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.can("tickets", "view")).toBe(false);
  });

  it("refreshes when explicitly requested", async () => {
    mockGetMyPermissions.mockResolvedValue(CLIENT_USER);
    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockGetMyPermissions.mockResolvedValue(SUPER_ADMIN);
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.isSuperAdmin).toBe(true);
  });
});
