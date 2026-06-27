import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockOrgGet = jest.fn();
const mockBillingSummary = jest.fn();
const mockBillingListSubs = jest.fn();
const mockBillingListInvoices = jest.fn();
const mockBillingListPayments = jest.fn();
const mockBillingGetCustomer = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { get: mockOrgGet },
    billing: {
      summary: mockBillingSummary,
      listSubscriptions: mockBillingListSubs,
      listInvoices: mockBillingListInvoices,
      listPayments: mockBillingListPayments,
      getBillingCustomer: mockBillingGetCustomer,
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

jest.mock(
  "@/app/(admin)/admin/organizations/[orgId]/billing/AdminBillingClient",
  () => {
    return function MockBillingClient(props: any) {
      return <div data-testid="billing-client">{props.organizationId}</div>;
    };
  },
);

describe("AdminOrgBillingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockOrgGet.mockResolvedValue({ id: "o1", name: "Acme Corp" });
    mockBillingSummary.mockResolvedValue(null);
    mockBillingListSubs.mockResolvedValue([]);
    mockBillingListInvoices.mockResolvedValue({ items: [] });
    mockBillingListPayments.mockResolvedValue({ items: [] });
    mockBillingGetCustomer.mockResolvedValue(null);
  });

  it("renders org name and billing header", async () => {
    const Page = (
      await import("@/app/(admin)/admin/organizations/[orgId]/billing/page")
    ).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Acme Corp Billing")).toBeInTheDocument();
    expect(screen.getByTestId("billing-client")).toHaveTextContent("o1");
  });

  it("renders back link to organization", async () => {
    const Page = (
      await import("@/app/(admin)/admin/organizations/[orgId]/billing/page")
    ).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    const backLink = screen.getByText("Back to Organization");
    expect(backLink.closest("a")).toHaveAttribute(
      "href",
      "/admin/organizations/o1",
    );
  });

  it("handles null org gracefully", async () => {
    mockOrgGet.mockRejectedValue(new Error("not found"));
    const Page = (
      await import("@/app/(admin)/admin/organizations/[orgId]/billing/page")
    ).default;
    render(await Page({ params: Promise.resolve({ orgId: "bad" }) }));
    expect(screen.getByText("Organization Billing")).toBeInTheDocument();
  });

  it("passes billing data to client component", async () => {
    mockBillingSummary.mockResolvedValue({
      totalRevenue: 5000,
      activeSubscriptions: 2,
    });
    mockBillingListSubs.mockResolvedValue([{ id: "s1", plan: "pro" }]);
    mockBillingListInvoices.mockResolvedValue({ items: [{ id: "inv1" }] });
    mockBillingListPayments.mockResolvedValue({ items: [{ id: "pay1" }] });
    mockBillingGetCustomer.mockResolvedValue({
      id: "c1",
      email: "billing@test.com",
    });
    const Page = (
      await import("@/app/(admin)/admin/organizations/[orgId]/billing/page")
    ).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByTestId("billing-client")).toBeInTheDocument();
  });
});