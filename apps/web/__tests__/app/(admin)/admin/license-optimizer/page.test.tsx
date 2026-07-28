import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockLicenseOptimizerList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    licenseOptimizer: { list: mockLicenseOptimizerList },
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

describe("LicenseOptimizerPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockLicenseOptimizerList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with heading 'License Optimizer'", async () => {
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "License Optimizer" })).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs", async () => {
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
  });

  it("does not show removed action buttons", async () => {
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(screen.queryByText("Add License")).toBeNull();
  });

  it("shows empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(screen.getByText("No licenses tracked yet")).toBeInTheDocument();
  });

  it("renders list items with software name and license type when data exists", async () => {
    mockLicenseOptimizerList.mockResolvedValue({
      items: [
        {
          id: "1",
          software_name: "Microsoft 365",
          license_type: "Subscription",
          total_seats: 50,
          used_seats: 32,
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(screen.getByText("Microsoft 365")).toBeInTheDocument();
    expect(screen.getByText(/Subscription/)).toBeInTheDocument();
  });
});
