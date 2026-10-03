import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockListChecks = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    uptimeMonitor: { listChecks: mockListChecks },
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

describe("PortalUptimeMonitorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockListChecks.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/uptime-monitor/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /uptime monitor/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockListChecks.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/uptime-monitor/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders items when data exists", async () => {
    mockListChecks.mockResolvedValue({
      items: [
        {
          id: "um1",
          url: "https://acme.com",
          check_type: "HTTP",
          status: "up",
        },
        {
          id: "um2",
          url: "https://beta.org",
          check_type: "HTTPS",
          status: "down",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/uptime-monitor/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("https://acme.com")).toBeInTheDocument();
    expect(screen.getByText("https://beta.org")).toBeInTheDocument();
    expect(screen.getByText("Type: HTTP")).toBeInTheDocument();
    expect(screen.getByText("Type: HTTPS")).toBeInTheDocument();
    expect(screen.getByText("up")).toBeInTheDocument();
    expect(screen.getByText("down")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockListChecks.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/uptime-monitor/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No monitors configured.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/uptime-monitor/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
