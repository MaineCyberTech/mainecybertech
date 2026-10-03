import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockBudgetList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    final: { budgets: { list: mockBudgetList } },
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

describe("PortalBudgetsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockBudgetList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/budgets/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /budget roadmap/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockBudgetList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/budgets/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders items when data exists", async () => {
    mockBudgetList.mockResolvedValue({
      items: [
        {
          id: "b1",
          item_name: "Security Audit",
          category: "Security",
          estimated_cost: 15000,
          priority: "high",
          fiscal_year: 2026,
          quarter: 2,
          created_at: "2026-01-15T00:00:00Z",
        },
        {
          id: "b2",
          item_name: "Cloud Migration",
          category: "Infrastructure",
          estimated_cost: 45000,
          priority: "medium",
          fiscal_year: 2026,
          quarter: 3,
          created_at: "2026-02-01T00:00:00Z",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/budgets/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Security Audit")).toBeInTheDocument();
    expect(screen.getByText("Cloud Migration")).toBeInTheDocument();
    expect(screen.getByText(/Category: Security/)).toBeInTheDocument();
    expect(screen.getByText(/Category: Infrastructure/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockBudgetList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/budgets/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No budget items found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/budgets/page");
    const element = await Page();

    expect(element).toBeNull();
  });

  it("shows priority badges", async () => {
    mockBudgetList.mockResolvedValue({
      items: [
        {
          id: "b1",
          item_name: "Critical Item",
          category: "Security",
          estimated_cost: 10000,
          priority: "critical",
          fiscal_year: 2026,
          quarter: 1,
          created_at: "2026-01-15T00:00:00Z",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/budgets/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("critical")).toBeInTheDocument();
  });
});
