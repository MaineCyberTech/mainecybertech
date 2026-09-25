import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockRunbooksList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    final: { runbooks: { list: mockRunbooksList } },
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

describe("PortalRunbooksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockRunbooksList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/runbooks/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /runbooks/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockRunbooksList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/runbooks/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders runbooks when data exists", async () => {
    mockRunbooksList.mockResolvedValue({
      items: [
        {
          id: "rb1",
          title: "Incident Response Runbook",
          category: "Security",
          version: "2.1",
          created_at: "2026-01-15T00:00:00Z",
        },
        {
          id: "rb2",
          title: "Server Restart Procedure",
          category: "Operations",
          version: "1.0",
          created_at: "2026-02-01T00:00:00Z",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/runbooks/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Incident Response Runbook")).toBeInTheDocument();
    expect(screen.getByText("Server Restart Procedure")).toBeInTheDocument();
    expect(screen.getByText(/Category: Security/)).toBeInTheDocument();
    expect(screen.getByText(/Category: Operations/)).toBeInTheDocument();
    expect(screen.getByText(/Version: 2.1/)).toBeInTheDocument();
    expect(screen.getByText(/Version: 1.0/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockRunbooksList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/runbooks/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No runbooks found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/runbooks/page");
    const element = await Page();

    expect(element).toBeNull();
  });

  it("renders runbook count", async () => {
    mockRunbooksList.mockResolvedValue({
      items: [
        { id: "rb1", title: "Runbook A", created_at: new Date().toISOString() },
        { id: "rb2", title: "Runbook B", created_at: new Date().toISOString() },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/runbooks/page");
    const element = await Page();
    render(element);

    expect(screen.getByText(/2 runbooks for your organization/)).toBeInTheDocument();
  });
});
