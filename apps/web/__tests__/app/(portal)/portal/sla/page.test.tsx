import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockMetrics = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    sla: { metrics: mockMetrics },
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

describe("PortalSlaPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockMetrics.mockResolvedValue({ summary: {}, byMetric: [] });

    const { default: Page } = await import("@/app/(portal)/portal/sla/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /sla metrics/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockMetrics.mockResolvedValue({ summary: {}, byMetric: [] });

    const { default: Page } = await import("@/app/(portal)/portal/sla/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders summary metrics", async () => {
    mockMetrics.mockResolvedValue({
      summary: { total: 50, breached: 3, breachedRate: 0.06, resolved: 47 },
      byMetric: [],
    });

    const { default: Page } = await import("@/app/(portal)/portal/sla/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("6%")).toBeInTheDocument();
    expect(screen.getByText("47")).toBeInTheDocument();
  });

  it("renders by-metric data", async () => {
    mockMetrics.mockResolvedValue({
      summary: { total: 10, breached: 1, breachedRate: 0.1, resolved: 9 },
      byMetric: [
        { metric: "Response Time", total: 5, breached: 1, avgMinutes: 12 },
        { metric: "Resolution Time", total: 5, breached: 0, avgMinutes: 45 },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/sla/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Response Time")).toBeInTheDocument();
    expect(screen.getByText("Resolution Time")).toBeInTheDocument();
    expect(screen.getAllByText("Total: 5")).toHaveLength(2);
    expect(screen.getByText("Avg: 12 min")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockMetrics.mockResolvedValue({ summary: {}, byMetric: [] });

    const { default: Page } = await import("@/app/(portal)/portal/sla/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No SLA metrics available.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/sla/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
