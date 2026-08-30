import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockProposalsList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    proposals: { list: mockProposalsList },
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

jest.mock("@/components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, description }: { title: string; description: string }) =>
    React.createElement(
      "div",
      { "data-testid": "empty-state" },
      React.createElement("p", null, title),
      React.createElement("p", null, description),
    ),
}));

describe("PortalProposalsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockProposalsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/proposals/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /proposals/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockProposalsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/proposals/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders proposals when data exists", async () => {
    mockProposalsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          title: "Network Upgrade",
          status: "sent",
          grand_total: 25000,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          valid_until: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: "p2",
          title: "Security Assessment",
          status: "approved",
          grand_total: 12000,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          valid_until: null,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/proposals/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Network Upgrade")).toBeInTheDocument();
    expect(screen.getByText("Security Assessment")).toBeInTheDocument();
    expect(screen.getByText(/sent/)).toBeInTheDocument();
    expect(screen.getByText(/approved/)).toBeInTheDocument();
  });

  it("shows empty state when no proposals", async () => {
    mockProposalsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/proposals/page");
    const element = await Page();
    render(element);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No proposals yet")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/proposals/page");
    const element = await Page();
    render(element);

    expect(screen.getByText(/Access restricted/)).toBeInTheDocument();
  });

  it("renders proposal count", async () => {
    mockProposalsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          title: "Network Upgrade",
          status: "draft",
          grand_total: 5000,
          created_at: new Date().toISOString(),
          valid_until: null,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/proposals/page");
    const element = await Page();
    render(element);

    expect(screen.getByText(/1 proposals available/)).toBeInTheDocument();
  });
});
