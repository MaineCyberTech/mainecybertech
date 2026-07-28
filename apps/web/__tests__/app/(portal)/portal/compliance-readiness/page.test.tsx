import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockComplianceList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    eduAutomation: { compliance: { list: mockComplianceList } },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock(
  "@/components/StatusPill",
  () => ({
    __esModule: true,
    default: ({ status }: { status: string }) =>
      React.createElement("span", { "data-testid": "status-pill" }, status),
  }),
  { virtual: true },
);

describe("PortalComplianceReadinessPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockComplianceList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /compliance readiness/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockComplianceList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockComplianceList.mockResolvedValue({
      items: [
        {
          id: "c1",
          framework: "SOC 2",
          status: "compliant",
          score: 85,
          last_assessment_date: new Date().toISOString(),
        },
        {
          id: "c2",
          framework: "HIPAA",
          status: "in-progress",
          score: 62,
          last_assessment_date: new Date().toISOString(),
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("SOC 2")).toBeInTheDocument();
    expect(screen.getByText("HIPAA")).toBeInTheDocument();
    expect(screen.getByText(/Score: 85%/)).toBeInTheDocument();
    expect(screen.getByText(/Score: 62%/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockComplianceList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No compliance assessments yet.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockComplianceList.mockResolvedValue({
      items: [{ id: "c1", framework: "SOC 2", status: "compliant", score: 85 }],
    });

    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("compliant");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
