import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockSummary = jest.fn();
const mockListSubscriptions = jest.fn();
const mockListInvoices = jest.fn();
const mockGetBillingCustomer = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    billing: {
      summary: mockSummary,
      listSubscriptions: mockListSubscriptions,
      listInvoices: mockListInvoices,
      getBillingCustomer: mockGetBillingCustomer,
    },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock("@/components/portal/PortalSubnav", () => ({
  __esModule: true,
  default: () => React.createElement("nav", null),
}));

jest.mock("../BillingPageClient", () => ({
  __esModule: true,
  default: () => React.createElement("div", { "data-testid": "billing-client" }),
}));

describe("PortalBillingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockSummary.mockResolvedValue(null);
    mockListSubscriptions.mockResolvedValue([]);
    mockListInvoices.mockResolvedValue({ items: [] });
    mockGetBillingCustomer.mockResolvedValue(null);
  });

  it("renders heading", async () => {
    const { default: Page } = await import("@/app/(portal)/portal/billing/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /billing/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    const { default: Page } = await import("@/app/(portal)/portal/billing/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/billing/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
  });

  it("renders billing client component", async () => {
    const { default: Page } = await import("@/app/(portal)/portal/billing/page");
    const element = await Page();
    render(element);
    expect(screen.getByTestId("billing-client")).toBeInTheDocument();
  });

  it("calls billing APIs with org id", async () => {
    const { default: Page } = await import("@/app/(portal)/portal/billing/page");
    await Page();
    expect(mockSummary).toHaveBeenCalledWith({ organizationId: "org-1" });
    expect(mockListSubscriptions).toHaveBeenCalledWith({ organizationId: "org-1" });
  });
});
