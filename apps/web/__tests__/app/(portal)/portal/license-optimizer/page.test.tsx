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
    licenseOptimizer: { list: mockList },
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

describe("PortalLicenseOptimizerPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/license-optimizer/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /license optimizer/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/license-optimizer/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "lo1",
          software_name: "Microsoft 365 Business Basic",
          used_seats: 25,
          total_seats: 50,
          status: "Active",
        },
        {
          id: "lo2",
          software_name: "Adobe Creative Cloud",
          used_seats: 3,
          total_seats: 10,
          status: "Underutilized",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/license-optimizer/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Microsoft 365 Business Basic")).toBeInTheDocument();
    expect(screen.getByText("Adobe Creative Cloud")).toBeInTheDocument();
    expect(screen.getByText("25 / 50 seats used")).toBeInTheDocument();
    expect(screen.getByText("3 / 10 seats used")).toBeInTheDocument();
    expect(screen.getByText("50% utilization")).toBeInTheDocument();
    expect(screen.getByText("30% utilization")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/license-optimizer/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No license data available.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/license-optimizer/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
