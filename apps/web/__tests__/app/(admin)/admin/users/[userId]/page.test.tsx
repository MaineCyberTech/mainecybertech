import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockUsersGetDetail = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    users: { getDetail: mockUsersGetDetail },
  }),
}));

jest.mock("@/components/admin/PermissionsMatrix", () => ({
  __esModule: true,
  default: ({ userId }: any) => <div data-testid="permissions-matrix">{userId}</div>,
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
    return <nav data-testid="breadcrumbs">{items.map((i: any) => i.label).join(" > ")}</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

jest.mock("@/components/admin/AdminPageShell", () => {
  return function MockPageShell({ title, description, breadcrumbs, subnav, actions, children }: any) {
    return (
      <div>
        {breadcrumbs}
        {subnav}
        <h1 data-testid="page-title">{title}</h1>
        <p data-testid="page-desc">{description}</p>
        <div data-testid="page-actions">{actions}</div>
        <div data-testid="page-children">{children}</div>
      </div>
    );
  };
});

jest.mock("@/app/(admin)/admin/users/[userId]/actions", () => ({
  updateUserProfileBasics: jest.fn(),
  updateMembership: jest.fn(),
}));

const baseProfile = { id: "u1", full_name: "Alice Smith", email: "alice@test.com", phone: "+123", title: "Engineer", is_super_admin: false, default_organization_id: null };

function makeDetail(profileOverrides: Record<string, any> = {}, extra: Record<string, any> = {}) {
  return {
    user: { id: "u1", email: "alice@test.com", full_name: "Alice Smith", role_id: null, created_at: "" },
    profile: { ...baseProfile, ...profileOverrides },
    memberships: extra.memberships ?? [],
    organizations: extra.organizations ?? [],
    roles: extra.roles ?? [],
    allRoles: extra.allRoles ?? [],
  };
}

describe("UserDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockUsersGetDetail.mockResolvedValue(makeDetail());
  });

  it("renders user not found error", async () => {
    mockUsersGetDetail.mockRejectedValue(new Error("not found"));
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "bad" }) }));
    expect(screen.getByText("User not found.")).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent("Alice Smith");
    expect(screen.getByTestId("subnav")).toHaveTextContent("users");
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByTestId("page-title")).toHaveTextContent("Alice Smith");
    expect(screen.getByTestId("page-desc")).toHaveTextContent("alice@test.com");
  });

  it("renders profile section with form fields", async () => {
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alice Smith")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+123")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Engineer")).toBeInTheDocument();
    const emailInput = screen.getByDisplayValue("alice@test.com") as HTMLInputElement;
    expect(emailInput).toHaveAttribute("readOnly");
  });

  it("renders back button", async () => {
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("Back to Users")).toBeInTheDocument();
  });

  it("shows no memberships state", async () => {
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("Memberships")).toBeInTheDocument();
    expect(screen.getByText("No memberships found.")).toBeInTheDocument();
  });

  it("renders membership with org and role", async () => {
    mockUsersGetDetail.mockResolvedValue(makeDetail({}, {
      memberships: [{ id: "m1", organization_id: "o1", role_id: "r1", user_id: "u1", status: "approved", is_billing_contact: false, is_security_contact: false }],
      organizations: [{ id: "o1", name: "Acme Corp" }],
      roles: [{ id: "r1", name: "Admin" }],
    }));
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes("Admin") && c.includes("approved"))).toBeInTheDocument();
  });

  it("shows save profile button", async () => {
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("Save Profile")).toBeInTheDocument();
  });

  it("shows super admin badge when applicable", async () => {
    mockUsersGetDetail.mockResolvedValue(makeDetail({ is_super_admin: true }));
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("shows default org badge when applicable", async () => {
    mockUsersGetDetail.mockResolvedValue(makeDetail({ default_organization_id: "o1" }));
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText((c) => c.includes("Default Org"))).toBeInTheDocument();
  });

  it("shows unknown org for memberships with no match", async () => {
    mockUsersGetDetail.mockResolvedValue(makeDetail({}, {
      memberships: [{ id: "m1", organization_id: "missing", role_id: "r1", user_id: "u1", status: "pending" }],
      organizations: [],
      roles: [{ id: "r1", name: "Viewer" }],
    }));
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("Unknown Org")).toBeInTheDocument();
  });

  it("uses fallback title when no full_name", async () => {
    mockUsersGetDetail.mockResolvedValue(makeDetail({ full_name: null }));
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByTestId("page-title")).toHaveTextContent("User Detail");
  });

  it("shows save membership button", async () => {
    mockUsersGetDetail.mockResolvedValue(makeDetail({}, {
      memberships: [{ id: "m1", organization_id: "o1", role_id: "r1", user_id: "u1", status: "approved", is_billing_contact: false, is_security_contact: false }],
      organizations: [{ id: "o1", name: "Acme" }],
      roles: [{ id: "r1", name: "Admin", key: "admin" }],
    }));
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("Save Membership")).toBeInTheDocument();
  });

  it("shows billing and security contact checkboxes", async () => {
    mockUsersGetDetail.mockResolvedValue(makeDetail({}, {
      memberships: [{ id: "m1", organization_id: "o1", role_id: "r1", user_id: "u1", status: "approved", is_billing_contact: true, is_security_contact: true }],
      organizations: [{ id: "o1", name: "Acme" }],
      roles: [{ id: "r1", name: "Admin", key: "admin" }],
    }));
    const Page = (await import("@/app/(admin)/admin/users/[userId]/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("Billing Contact")).toBeInTheDocument();
    expect(screen.getByText("Security Contact")).toBeInTheDocument();
  });
});