import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockOrgsGetDetail = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { getDetail: mockOrgsGetDetail },
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

jest.mock("@/app/(admin)/admin/organizations/[orgId]/actions", () => ({
  updateOrganizationBasics: jest.fn(),
  createOrganizationDomain: jest.fn(),
  updateOrganizationDomain: jest.fn(),
}));

const baseOrg = { id: "o1", name: "Acme Corp", slug: "acme", status: "approved", primary_domain: "acme.com", support_plan: "premium" };

function makeDetail(orgOverrides: Record<string, any> = {}, extra: Record<string, any> = {}) {
  return {
    organization: { ...baseOrg, ...orgOverrides },
    domains: extra.domains ?? [],
    memberships: extra.memberships ?? [],
    profiles: extra.profiles ?? [],
    roles: extra.roles ?? [],
  };
}

describe("OrganizationDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockOrgsGetDetail.mockResolvedValue(makeDetail());
  });

  it("renders org not found error", async () => {
    mockOrgsGetDetail.mockRejectedValue(new Error("not found"));
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "bad" }) }));
    expect(screen.getByText("Organization not found.")).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent("Acme Corp");
    expect(screen.getByTestId("subnav")).toHaveTextContent("organizations");
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByTestId("page-title")).toHaveTextContent("Acme Corp");
    expect(screen.getByTestId("page-desc")).toHaveTextContent("Manage org metadata, domains, and memberships.");
  });

  it("renders org basics form with fields", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Organization Basics")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("acme")).toBeInTheDocument();
    expect(screen.getByDisplayValue("acme.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("premium")).toBeInTheDocument();
  });

  it("renders back button", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Back to Organizations")).toBeInTheDocument();
  });

  it("shows save org button", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Save Organization")).toBeInTheDocument();
  });

  it("renders domains section with empty state", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Domains")).toBeInTheDocument();
    expect(screen.getByText("No domains configured.")).toBeInTheDocument();
  });

  it("renders domains list", async () => {
    mockOrgsGetDetail.mockResolvedValue(makeDetail({}, {
      domains: [{ id: "d1", domain: "example.com", auto_approve: true }],
    }));
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("Auto-approve: Enabled")).toBeInTheDocument();
  });

  it("shows Add Domain form", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByPlaceholderText("example.com")).toBeInTheDocument();
    expect(screen.getByText("Add Domain")).toBeInTheDocument();
  });

  it("renders memberships section with empty state", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Memberships")).toBeInTheDocument();
    expect(screen.getByText("No memberships found.")).toBeInTheDocument();
  });

  it("renders membership with profile info", async () => {
    mockOrgsGetDetail.mockResolvedValue(makeDetail({}, {
      memberships: [{ id: "m1", user_id: "u1", role_id: "r1", organization_id: "o1", status: "approved", is_billing_contact: true, is_security_contact: false }],
      profiles: [{ id: "u1", full_name: "Bob Jones", email: "bob@test.com" }],
      roles: [{ id: "r1", name: "Admin" }],
    }));
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText("Billing Contact")).toBeInTheDocument();
  });

  it("links membership to user detail page", async () => {
    mockOrgsGetDetail.mockResolvedValue(makeDetail({}, {
      memberships: [{ id: "m1", user_id: "u1", role_id: "r1", organization_id: "o1", status: "approved", is_billing_contact: false, is_security_contact: false }],
      profiles: [{ id: "u1", full_name: "Bob Jones", email: "bob@test.com" }],
      roles: [{ id: "r1", name: "Admin" }],
    }));
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    const link = screen.getByText("Bob Jones").closest("a");
    expect(link).toHaveAttribute("href", "/admin/users/u1");
  });

  it("shows unknown user when profile not found", async () => {
    mockOrgsGetDetail.mockResolvedValue(makeDetail({}, {
      memberships: [{ id: "m1", user_id: "missing", role_id: "r1", organization_id: "o1", status: "pending" }],
      profiles: [],
      roles: [{ id: "r1", name: "Viewer" }],
    }));
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Unknown User")).toBeInTheDocument();
  });

  it("shows security contact badge", async () => {
    mockOrgsGetDetail.mockResolvedValue(makeDetail({}, {
      memberships: [{ id: "m1", user_id: "u1", role_id: "r1", organization_id: "o1", status: "approved", is_billing_contact: false, is_security_contact: true }],
      profiles: [{ id: "u1", full_name: "Bob", email: "b@t.com" }],
      roles: [{ id: "r1", name: "User" }],
    }));
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Security Contact")).toBeInTheDocument();
  });

  it("renders domain with auto-approve disabled", async () => {
    mockOrgsGetDetail.mockResolvedValue(makeDetail({}, {
      domains: [{ id: "d1", domain: "manual.com", auto_approve: false }],
    }));
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Auto-approve: Disabled")).toBeInTheDocument();
  });
});