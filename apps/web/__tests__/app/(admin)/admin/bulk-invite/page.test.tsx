import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockOrgsList = jest.fn();
const mockRolesList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
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

jest.mock("@/components/admin/BulkInviteForm", () => {
  return function MockBulkInviteForm({ organizations, roles }: any) {
    return (
      <div data-testid="bulk-invite-form">
        <span data-testid="org-count">{organizations.length}</span>
        <span data-testid="role-count">{roles.length}</span>
      </div>
    );
  };
});

describe("AdminBulkInvitePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
  });

  it("renders page shell with title and description", async () => {
    mockOrgsList.mockResolvedValue([]);
    mockRolesList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/bulk-invite/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Bulk User Import" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Import multiple users via CSV/),
    ).toBeInTheDocument();
  });

  it("renders bulk invite form component", async () => {
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme Corp" }]);
    mockRolesList.mockResolvedValue([
      { id: "r1", name: "Admin", key: "admin" },
    ]);
    const Page = (await import("@/app/(admin)/admin/bulk-invite/page")).default;
    render(await Page());
    expect(screen.getByTestId("bulk-invite-form")).toBeInTheDocument();
  });

  it("passes organizations and roles to form", async () => {
    mockOrgsList.mockResolvedValue([
      { id: "o1", name: "Org 1" },
      { id: "o2", name: "Org 2" },
    ]);
    mockRolesList.mockResolvedValue([
      { id: "r1", name: "Admin", key: "admin" },
      { id: "r2", name: "User", key: "client_user" },
    ]);
    const Page = (await import("@/app/(admin)/admin/bulk-invite/page")).default;
    render(await Page());
    expect(screen.getByTestId("org-count")).toHaveTextContent("2");
    expect(screen.getByTestId("role-count")).toHaveTextContent("2");
  });

  it("requires admin access", async () => {
    mockOrgsList.mockResolvedValue([]);
    mockRolesList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/bulk-invite/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    mockOrgsList.mockResolvedValue([]);
    mockRolesList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/bulk-invite/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent("2 items");
    expect(screen.getByTestId("subnav")).toHaveTextContent("approvals");
  });
});
