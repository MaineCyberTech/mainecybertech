import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockLicensesList = jest.fn();
const mockLicensesSavings = jest.fn();
jest.mock("@/lib/api", () => () => ({
  batch: { licenses: { list: mockLicensesList, savings: mockLicensesSavings } },
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

describe("LicensesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockLicensesList.mockResolvedValue({ items: [] });
    mockLicensesSavings.mockResolvedValue({
      totalAnnualCost: 0,
      reclaimableSavings: 0,
      unusedSeats: 0,
    });
  });

  it("renders page title", async () => {
    const Page = (await import("@/app/(admin)/admin/licenses/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: /license optimizer & seat reclaimer/i }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/licenses/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("licenses");
  });

  it("shows empty state when no data", async () => {
    const Page = (await import("@/app/(admin)/admin/licenses/page")).default;
    render(await Page());
    expect(screen.getByText(/no licenses tracked/i)).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockLicensesList.mockResolvedValue({
      items: [
        {
          id: "1",
          vendor: "Microsoft",
          product_name: "Office 365",
          total_seats: 50,
          assigned_seats: 30,
          unused_seats: 20,
          annual_cost: 12000,
          reclaimable_savings: 4800,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/licenses/page")).default;
    render(await Page());
    expect(screen.getByText(/Microsoft.*Office 365/)).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/licenses/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockLicensesList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/licenses/page")).default;
    render(await Page());
    expect(screen.getByText(/no licenses tracked/i)).toBeInTheDocument();
  });
});
