import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockDnsChangesList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    final: { dnsChanges: { list: mockDnsChangesList } },
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

describe("DnsChangesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockDnsChangesList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/dns-changes/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /dns change requests/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockDnsChangesList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/dns-changes/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockDnsChangesList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/dns-changes/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/no dns change requests found/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/dns-changes/page");
    const element = await Page();
    expect(element).toBeNull();
  });

  it("renders items when data exists", async () => {
    mockDnsChangesList.mockResolvedValue({
      items: [
        {
          id: "1",
          name: "Test Change",
          change_type: "A record",
          domain: "example.com",
          status: "pending",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const { default: Page } = await import("@/app/(portal)/portal/dns-changes/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("Test Change")).toBeInTheDocument();
  });
});
