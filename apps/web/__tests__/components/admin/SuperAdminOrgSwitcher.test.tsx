import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SuperAdminOrgSwitcher from "@/components/admin/SuperAdminOrgSwitcher";

const mockListAll = jest.fn();
const mockSetActiveOrg = jest.fn();
const mockRefresh = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: () => ({
    organizations: { listAll: (...args: any[]) => mockListAll(...args) },
  }),
}));

jest.mock("@/lib/org-actions", () => ({
  setActiveOrg: (...args: any[]) => mockSetActiveOrg(...args),
}));

const mockCan = jest.fn();
const mockIsSuperAdmin = jest.fn(() => false);
const mockPermissionsLoading = jest.fn(() => false);
jest.mock("@/lib/use-permissions", () => ({
  usePermissions: () => ({
    isSuperAdmin: mockIsSuperAdmin(),
    loading: mockPermissionsLoading(),
    can: (...args: any[]) => mockCan(...args),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => mockRefresh() }),
}));

const ORGS = [
  { id: "o1", name: "Acme Corp", status: "active" },
  { id: "o2", name: "Beta LLC", status: "active" },
  { id: "o3", name: "Suspended Co", status: "suspended" },
];

describe("SuperAdminOrgSwitcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSuperAdmin.mockReturnValue(false);
    mockPermissionsLoading.mockReturnValue(false);
    mockListAll.mockResolvedValue(ORGS);
    mockSetActiveOrg.mockResolvedValue(undefined);
  });

  it("renders nothing for non-super admins", () => {
    const { container } = render(<SuperAdminOrgSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while permissions load", () => {
    mockIsSuperAdmin.mockReturnValue(true);
    mockPermissionsLoading.mockReturnValue(true);
    const { container } = render(<SuperAdminOrgSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists all tenants for super admins", async () => {
    mockIsSuperAdmin.mockReturnValue(true);
    render(<SuperAdminOrgSwitcher />);
    await waitFor(() => {
      expect(mockListAll).toHaveBeenCalled();
    });
    const select = screen.getByLabelText("Switch active tenant (super admin)") as HTMLSelectElement;
    expect(select.options.length).toBe(3);
    expect(select.options[0].textContent).toBe("Acme Corp");
    expect(select.options[2].textContent).toContain("suspended");
  });

  it("switches tenant via setActiveOrg and refreshes", async () => {
    mockIsSuperAdmin.mockReturnValue(true);
    render(<SuperAdminOrgSwitcher />);
    await waitFor(() => {
      expect(screen.getByLabelText("Switch active tenant (super admin)")).toBeInTheDocument();
    });
    const select = screen.getByLabelText("Switch active tenant (super admin)") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "o2" } });
    await waitFor(() => {
      expect(mockSetActiveOrg).toHaveBeenCalledWith("o2");
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows an empty state when there are no tenants", async () => {
    mockIsSuperAdmin.mockReturnValue(true);
    mockListAll.mockResolvedValue([]);
    render(<SuperAdminOrgSwitcher />);
    await waitFor(() => {
      const select = screen.getByLabelText(
        "Switch active tenant (super admin)",
      ) as HTMLSelectElement;
      expect(select.options[0].textContent).toBe("No tenants");
    });
  });
});
