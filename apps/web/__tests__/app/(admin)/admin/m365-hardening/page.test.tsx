import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockM365List = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    securitySuite: { m365: { list: mockM365List } },
  }),
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mocks.requireAdminAccess(...args),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/components/Breadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

jest.mock("@/components/EmptyState", () => {
  return function MockEmptyState({ title, description }: any) {
    return (
      <div data-testid="empty-state">
        <p>{title}</p>
        <p>{description}</p>
      </div>
    );
  };
});

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crud-form">{title}</div>;
  };
});

jest.mock("@/lib/module-actions", () => ({
  createM365Assessment: jest.fn(),
}));

describe("AdminM365HardeningPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockM365List.mockResolvedValue({ items: [] });
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/m365-hardening/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "M365 Tenant Hardening Scanner" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Guided Microsoft 365 security baseline/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/m365-hardening/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("m365-hardening");
  });

  it("shows empty state when no assessments", async () => {
    const Page = (await import("@/app/(admin)/admin/m365-hardening/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No M365 assessments")).toBeInTheDocument();
  });

  it("renders crud form for new assessment", async () => {
    const Page = (await import("@/app/(admin)/admin/m365-hardening/page")).default;
    render(await Page());
    expect(screen.getByTestId("crud-form")).toHaveTextContent("New M365 Assessment");
  });

  it("renders tenant items with domain and score", async () => {
    mockM365List.mockResolvedValue({
      items: [
        {
          id: "t1",
          tenant_domain: "contoso.onmicrosoft.com",
          mfa_enforced: true,
          conditional_access_configured: true,
          legacy_auth_blocked: false,
          overall_score: 85,
          status: "assessed",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/m365-hardening/page")).default;
    render(await Page());
    expect(screen.getByText("contoso.onmicrosoft.com")).toBeInTheDocument();
  });
});
