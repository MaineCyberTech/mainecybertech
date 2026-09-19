import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockDomainMonitorList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    domainMonitors: { list: mockDomainMonitorList },
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

describe("DomainMonitorsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockDomainMonitorList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/domain-monitors/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /domain monitors/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockDomainMonitorList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/domain-monitors/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders monitors when data exists", async () => {
    mockDomainMonitorList.mockResolvedValue({
      items: [
        {
          id: "d1",
          domain: "acme.com",
          display_name: "Acme Corp",
          ssl_valid: true,
          ssl_expires: "2026-12-01T00:00:00Z",
          spf_status: "pass",
          dkim_status: "pass",
          dmarc_status: "fail",
          cloudflare_proxied: true,
          status: "active",
        },
        {
          id: "d2",
          domain: "example.org",
          ssl_valid: false,
          spf_status: "fail",
          dkim_status: "unknown",
          dmarc_status: "unknown",
          cloudflare_proxied: false,
          status: "error",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/domain-monitors/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("acme.com")).toBeInTheDocument();
    expect(screen.getByText("example.org")).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("error")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockDomainMonitorList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/domain-monitors/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No domain monitors found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/domain-monitors/page");
    const element = await Page();

    expect(element).toBeNull();
  });

  it("displays status badges", async () => {
    mockDomainMonitorList.mockResolvedValue({
      items: [
        {
          id: "d1",
          domain: "acme.com",
          ssl_valid: true,
          spf_status: "pass",
          dkim_status: "pass",
          dmarc_status: "pass",
          cloudflare_proxied: true,
          status: "active",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/domain-monitors/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
