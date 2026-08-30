import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    serviceCatalog: { list: mockList },
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

describe("PortalServiceCatalogPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/service-catalog/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /service catalog/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/service-catalog/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "sc1",
          name: "SIEM Monitoring",
          category: "Security",
          billing_model: "per_seat",
          unit: "month",
          base_price: 15,
          included_units: "10",
          is_bundled: false,
          is_active: true,
          description: "24/7 SIEM monitoring",
        },
        {
          id: "sc2",
          name: "Backup Service",
          category: "Infrastructure",
          billing_model: "flat",
          unit: "month",
          base_price: 99,
          is_bundled: true,
          is_active: true,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/service-catalog/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("SIEM Monitoring")).toBeInTheDocument();
    expect(screen.getByText("Backup Service")).toBeInTheDocument();
    expect(screen.getByText("Category: Security")).toBeInTheDocument();
    expect(screen.getByText("Billing: per_seat / month")).toBeInTheDocument();
    expect(screen.getByText(/\$15\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$99\.00/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/service-catalog/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No services in catalog.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/service-catalog/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
