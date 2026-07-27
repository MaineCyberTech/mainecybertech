import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockBillingSummary = jest.fn();
const mockBillingListSubscriptions = jest.fn();
const mockBillingListInvoices = jest.fn();
const mockBillingGetBillingCustomer = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    billing: {
      summary: mockBillingSummary,
      listSubscriptions: mockBillingListSubscriptions,
      listInvoices: mockBillingListInvoices,
      getBillingCustomer: mockBillingGetBillingCustomer,
    },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/app/(portal)/portal/billing/BillingPageClient", () => ({
  __esModule: true,
  default: ({ summary, subscriptions, invoices, customer }: any) => (
    <div data-testid="billing-client">
      <span data-testid="summary">{summary ? "has summary" : "no summary"}</span>
      <span data-testid="subscriptions">{subscriptions?.length ?? 0}</span>
      <span data-testid="invoices">{invoices?.length ?? 0}</span>
      <span data-testid="customer">{customer ? "has customer" : "no customer"}</span>
    </div>
  ),
}));

describe("PortalBillingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockBillingSummary.mockResolvedValue({ total: 1000 });
    mockBillingListSubscriptions.mockResolvedValue([{ id: "sub1", status: "active" }]);
    mockBillingListInvoices.mockResolvedValue({
      items: [
        { id: "inv1", amount: 500 },
        { id: "inv2", amount: 500 },
      ],
    });
    mockBillingGetBillingCustomer.mockResolvedValue({ id: "cus1", email: "test@example.com" });
  });

  it("renders billing heading", async () => {
    const { default: PortalBillingPage } = await import("@/app/(portal)/portal/billing/page");
    const element = await PortalBillingPage();
    render(element);

    expect(screen.getByRole("heading", { name: /billing/i })).toBeInTheDocument();
    expect(
      screen.getByText(/view invoices, subscriptions, and payment history/i),
    ).toBeInTheDocument();
  });

  it("renders BillingPageClient with data", async () => {
    const { default: PortalBillingPage } = await import("@/app/(portal)/portal/billing/page");
    const element = await PortalBillingPage();
    render(element);

    expect(screen.getByTestId("billing-client")).toBeInTheDocument();
    expect(screen.getByText("has summary")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("has customer")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: PortalBillingPage } = await import("@/app/(portal)/portal/billing/page");
    const element = await PortalBillingPage();
    render(element);

    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
  });

  it("handles billing API failures gracefully", async () => {
    mockBillingSummary.mockRejectedValue(new Error("Stripe down"));
    mockBillingListSubscriptions.mockRejectedValue(new Error("Stripe down"));
    mockBillingListInvoices.mockRejectedValue(new Error("Stripe down"));
    mockBillingGetBillingCustomer.mockRejectedValue(new Error("Stripe down"));

    const { default: PortalBillingPage } = await import("@/app/(portal)/portal/billing/page");
    const element = await PortalBillingPage();
    render(element);

    expect(screen.getByRole("heading", { name: /billing/i })).toBeInTheDocument();
    expect(screen.getByTestId("billing-client")).toBeInTheDocument();
    expect(screen.getByText("no summary")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("no customer")).toBeInTheDocument();
  });

  it("renders breadcrumbs with portal link", async () => {
    const { default: PortalBillingPage } = await import("@/app/(portal)/portal/billing/page");
    const element = await PortalBillingPage();
    render(element);

    const portalLink = screen.getByText("Portal").closest("a");
    expect(portalLink).toHaveAttribute("href", "/portal/dashboard");
  });
});
