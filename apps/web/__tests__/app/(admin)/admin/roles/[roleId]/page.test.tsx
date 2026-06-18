import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockRolesGet = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    roles: { get: mockRolesGet },
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

jest.mock("@/components/admin/RolePermissionsEditor", () => {
  return function MockEditor({ roleId, roleKey, isSystem }: any) {
    return (
      <div data-testid="permissions-editor">
        {roleKey} - {String(isSystem)}
      </div>
    );
  };
});

describe("RoleDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
  });

  it("renders role name and description", async () => {
    mockRolesGet.mockResolvedValue({
      id: "r1",
      key: "admin",
      name: "Admin",
      description: "Admin role",
      is_system: true,
    });
    const Page = (await import("@/app/(admin)/admin/roles/[roleId]/page"))
      .default;
    render(await Page({ params: Promise.resolve({ roleId: "r1" }) }));
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Admin role")).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    mockRolesGet.mockResolvedValue({
      id: "r1",
      key: "admin",
      name: "Admin",
      description: null,
      is_system: false,
    });
    const Page = (await import("@/app/(admin)/admin/roles/[roleId]/page"))
      .default;
    render(await Page({ params: Promise.resolve({ roleId: "r1" }) }));
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("roles");
  });

  it("renders back link", async () => {
    mockRolesGet.mockResolvedValue({
      id: "r1",
      key: "admin",
      name: "Admin",
      description: null,
      is_system: false,
    });
    const Page = (await import("@/app/(admin)/admin/roles/[roleId]/page"))
      .default;
    render(await Page({ params: Promise.resolve({ roleId: "r1" }) }));
    const backLink = screen.getByText("Back");
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest("a")).toHaveAttribute("href", "/admin/roles");
  });

  it("renders permission editor with correct props", async () => {
    mockRolesGet.mockResolvedValue({
      id: "r1",
      key: "super_admin",
      name: "Super Admin",
      description: null,
      is_system: true,
    });
    const Page = (await import("@/app/(admin)/admin/roles/[roleId]/page"))
      .default;
    render(await Page({ params: Promise.resolve({ roleId: "r1" }) }));
    const editor = screen.getByTestId("permissions-editor");
    expect(editor).toHaveTextContent("super_admin");
    expect(editor).toHaveTextContent("true");
  });

  it("renders permission toggle heading", async () => {
    mockRolesGet.mockResolvedValue({
      id: "r1",
      key: "admin",
      name: "Admin",
      description: "Admin role",
      is_system: false,
    });
    const Page = (await import("@/app/(admin)/admin/roles/[roleId]/page"))
      .default;
    render(await Page({ params: Promise.resolve({ roleId: "r1" }) }));
    expect(screen.getByText("Permission Toggles")).toBeInTheDocument();
  });

  it("shows error for not-found role", async () => {
    mockRolesGet.mockRejectedValue(new Error("not found"));
    const Page = (await import("@/app/(admin)/admin/roles/[roleId]/page"))
      .default;
    render(await Page({ params: Promise.resolve({ roleId: "missing" }) }));
    expect(screen.getByText("Role not found.")).toBeInTheDocument();
  });

  it("uses fallback for missing description", async () => {
    mockRolesGet.mockResolvedValue({
      id: "r1",
      key: "admin",
      name: "Admin",
      description: null,
      is_system: false,
    });
    const Page = (await import("@/app/(admin)/admin/roles/[roleId]/page"))
      .default;
    render(await Page({ params: Promise.resolve({ roleId: "r1" }) }));
    expect(screen.getByText("No description")).toBeInTheDocument();
  });
});
