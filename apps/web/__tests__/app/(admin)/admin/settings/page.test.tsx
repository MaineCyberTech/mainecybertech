import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

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

jest.mock("@/components/admin/AdminPageShell", () => {
  return function MockShell({ title, children }: any) {
    return (
      <div>
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

jest.mock("@/app/(admin)/admin/settings/EmailTestClient", () => {
  return function MockEmailTestClient() {
    return <div data-testid="email-test-client" />;
  };
});

describe("AdminSettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
  });

  it("renders page title", async () => {
    const Page = (await import("@/app/(admin)/admin/settings/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/settings/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("settings");
  });

  it("renders email configuration section", async () => {
    const Page = (await import("@/app/(admin)/admin/settings/page")).default;
    render(await Page());
    expect(screen.getByText("Email Configuration")).toBeInTheDocument();
    expect(screen.getByText(/Send a test email/)).toBeInTheDocument();
  });

  it("renders EmailTestClient component", async () => {
    const Page = (await import("@/app/(admin)/admin/settings/page")).default;
    render(await Page());
    expect(screen.getByTestId("email-test-client")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/settings/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });
});
