import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockContractsList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    vendors: { contracts: { list: mockContractsList } },
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

describe("PortalVendorContractsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockContractsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/vendor-contracts/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /vendor contracts/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockContractsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/vendor-contracts/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockContractsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/vendor-contracts/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/no vendor contracts found/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/vendor-contracts/page");
    const element = await Page();
    expect(element).toBeNull();
  });

  it("renders items when data exists", async () => {
    mockContractsList.mockResolvedValue({
      items: [
        {
          id: "1",
          vendor_name: "Acme Corp",
          service_name: "Internet",
          contract_type: "monthly",
          contract_number: "CN-001",
          status: "active",
          start_date: "2026-01-01T00:00:00Z",
          end_date: "2026-12-31T00:00:00Z",
          contract_value: 12000,
          auto_renews: true,
        },
      ],
    });
    const { default: Page } = await import("@/app/(portal)/portal/vendor-contracts/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });
});
