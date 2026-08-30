import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockSaasAuditList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    final: { saasAudit: { list: mockSaasAuditList } },
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

describe("SaasAuditPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockSaasAuditList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/saas-audit/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /saas subscription audit/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockSaasAuditList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/saas-audit/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockSaasAuditList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/saas-audit/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/no saas subscriptions found/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/saas-audit/page");
    const element = await Page();
    expect(element).toBeNull();
  });

  it("renders items when data exists", async () => {
    mockSaasAuditList.mockResolvedValue({
      items: [
        {
          id: "1",
          vendor_name: "Microsoft",
          service_name: "Office 365",
          monthly_cost: 100,
          annual_cost: 1200,
          classification: "Productivity",
          renewal_date: "2026-06-01",
          cancellation_risk: "low",
          has_data_access: true,
        },
      ],
    });
    const { default: Page } = await import("@/app/(portal)/portal/saas-audit/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("Microsoft")).toBeInTheDocument();
    expect(screen.getByText("Office 365")).toBeInTheDocument();
    expect(screen.getByText(/Classification: Productivity/)).toBeInTheDocument();
  });
});
