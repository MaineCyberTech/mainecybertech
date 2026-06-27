import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

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

jest.mock("@/components/HealthDashboardClient", () => {
  return function MockHealthClient() {
    return <div data-testid="health-dashboard">Health Dashboard</div>;
  };
});

describe("AdminHealthPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
  });

  it("renders page shell with title", async () => {
    const Page = (await import("@/app/(admin)/admin/health/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Service Health" }),
    ).toBeInTheDocument();
  });

  it("renders health dashboard client", async () => {
    const Page = (await import("@/app/(admin)/admin/health/page")).default;
    render(await Page());
    expect(screen.getByTestId("health-dashboard")).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/health/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("home");
  });
});