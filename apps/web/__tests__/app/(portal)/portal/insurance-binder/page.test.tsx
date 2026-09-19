import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockInsuranceList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    insuranceBinder: { list: mockInsuranceList },
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

describe("PortalInsuranceBinderPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockInsuranceList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/insurance-binder/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /insurance evidence/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockInsuranceList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/insurance-binder/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockInsuranceList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/insurance-binder/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/no evidence items found/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/insurance-binder/page");
    const element = await Page();
    expect(element).toBeNull();
  });

  it("renders items when data exists", async () => {
    mockInsuranceList.mockResolvedValue({
      items: [
        {
          id: "1",
          title: "Cyber Policy",
          coverage_area: "General Liability",
          status: "verified",
          expiry_date: "2026-12-31T00:00:00Z",
        },
      ],
    });
    const { default: Page } = await import("@/app/(portal)/portal/insurance-binder/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("Cyber Policy")).toBeInTheDocument();
  });
});
