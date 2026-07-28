import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockChangesList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    governance: { changes: { list: mockChangesList } },
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

describe("GovernancePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockChangesList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/governance/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /governance/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockChangesList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/governance/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders change requests when data exists", async () => {
    mockChangesList.mockResolvedValue({
      items: [
        {
          id: "g1",
          title: "Firewall Rule Update",
          description: "Allow new vendor IP range",
          status: "active",
          priority: "high",
          requested_by: "John Doe",
          created_at: "2026-01-15T00:00:00Z",
        },
        {
          id: "g2",
          name: "DNS Change Request",
          status: "draft",
          priority: "medium",
          requested_by: "Jane Smith",
          created_at: "2026-02-01T00:00:00Z",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/governance/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Firewall Rule Update")).toBeInTheDocument();
    expect(screen.getByText("DNS Change Request")).toBeInTheDocument();
    expect(screen.getByText("Allow new vendor IP range")).toBeInTheDocument();
    expect(screen.getByText(/Priority: high/)).toBeInTheDocument();
    expect(screen.getByText(/Priority: medium/)).toBeInTheDocument();
    expect(screen.getByText(/Requested by: John Doe/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockChangesList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/governance/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No change requests found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/governance/page");
    const element = await Page();

    expect(element).toBeNull();
  });

  it("displays status pills", async () => {
    mockChangesList.mockResolvedValue({
      items: [
        {
          id: "g1",
          title: "Firewall Rule",
          status: "active",
          priority: "low",
          requested_by: "Admin",
          created_at: new Date().toISOString(),
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/governance/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
