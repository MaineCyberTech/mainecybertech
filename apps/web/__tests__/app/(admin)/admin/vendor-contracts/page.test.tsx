import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockContractsList = jest.fn();
const mockRenewalsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    vendors: {
      contracts: { list: mockContractsList, renewals: mockRenewalsList },
    },
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
  createVendorContract: jest.fn(),
}));

describe("AdminVendorContractsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockContractsList.mockResolvedValue({ items: [] });
    mockRenewalsList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Vendor Contract Renewal Calendar" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Track vendor contracts, renewals/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("vendor-contracts");
  });

  it("shows empty state when no contracts", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No contracts")).toBeInTheDocument();
  });

  it("renders crud form for new contract", async () => {
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(screen.getByTestId("crud-form")).toHaveTextContent("New Vendor Contract");
  });

  it("renders upcoming renewals section", async () => {
    mockRenewalsList.mockResolvedValue({
      items: [{ id: "r1", vendor_name: "Acme", service_name: "SaaS", renewal_date: "2026-06-01" }],
    });
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(screen.getByText(/Upcoming Renewals/)).toBeInTheDocument();
    expect(screen.getByText("Acme — SaaS")).toBeInTheDocument();
  });

  it("renders contract items with status badge", async () => {
    mockContractsList.mockResolvedValue({
      items: [
        {
          id: "c1",
          vendor_name: "VendorCo",
          service_name: "Support",
          renewal_date: null,
          end_date: null,
          contract_value: 50000,
          auto_renews: true,
          status: "active",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/vendor-contracts/page")).default;
    render(await Page());
    expect(screen.getByText("VendorCo — Support")).toBeInTheDocument();
    expect(screen.getAllByText("active").length).toBeGreaterThanOrEqual(1);
  });
});
