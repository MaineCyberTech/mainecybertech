import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockContractsList = jest.fn();
const mockContractRenewals = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    vendors: { contracts: { list: mockContractsList, renewals: mockContractRenewals } },
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

describe("VendorContractsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockContractsList.mockResolvedValue({ items: [] });
    mockContractRenewals.mockResolvedValue({ items: [] });
  });

  it("renders page title", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: /vendor contract renewal calendar/i }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("vendor-contracts");
  });

  it("shows empty state when no data", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(screen.getByText(/no contracts/i)).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockContractsList.mockResolvedValue({
      items: [
        {
          id: "1",
          vendor_name: "Acme Corp",
          service_name: "Internet",
          status: "active",
          renewal_date: null,
          end_date: null,
          contract_value: 12000,
          auto_renews: true,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(screen.getByText(/Acme Corp.*Internet/)).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockContractsList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(screen.getByText(/no contracts/i)).toBeInTheDocument();
  });
});
