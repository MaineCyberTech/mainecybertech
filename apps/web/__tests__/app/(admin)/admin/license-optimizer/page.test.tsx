import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockLicenseOptimizerList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    licenseOptimizer: { list: mockLicenseOptimizerList },
  }),
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

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("LicenseOptimizerPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockLicenseOptimizerList.mockResolvedValue({ items: [] });
  });

  it("renders page title", async () => {
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: /license optimizer/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("license-optimizer");
  });

  it("shows empty state when no data", async () => {
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(screen.getByText(/no licenses tracked yet/i)).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockLicenseOptimizerList.mockResolvedValue({
      items: [
        {
          id: "1",
          software_name: "Microsoft 365",
          license_type: "user",
          total_seats: 50,
          used_seats: 30,
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(screen.getByText("Microsoft 365")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockLicenseOptimizerList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/license-optimizer/page")).default;
    render(await Page());
    expect(screen.getByText(/no licenses tracked yet/i)).toBeInTheDocument();
  });
});
