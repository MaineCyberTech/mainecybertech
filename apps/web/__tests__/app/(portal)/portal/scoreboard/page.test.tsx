import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockScorecardsList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    eduAutomation: { scorecards: { list: mockScorecardsList } },
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

describe("PortalScoreboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockScorecardsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/scoreboard/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /cyber scoreboard/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockScorecardsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/scoreboard/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockScorecardsList.mockResolvedValue({
      items: [
        {
          id: "s1",
          category: "Endpoint Hygiene",
          badge: "Gold",
          score: 78,
          max_score: 100,
          last_updated: new Date().toISOString(),
        },
        {
          id: "s2",
          category: "MFA Adoption",
          badge: null,
          score: 40,
          max_score: 100,
          last_updated: null,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/scoreboard/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Endpoint Hygiene")).toBeInTheDocument();
    expect(screen.getByText("MFA Adoption")).toBeInTheDocument();
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText(/Score: 78\/100 \(78%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Score: 40\/100 \(40%\)/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockScorecardsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/scoreboard/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No scorecards available.")).toBeInTheDocument();
  });

  it("renders a progress bar and mascot-style encouragement", async () => {
    mockScorecardsList.mockResolvedValue({
      items: [{ id: "s1", category: "Overall", badge: "Gold", score: 95, max_score: 100 }],
    });

    const { default: Page } = await import("@/app/(portal)/portal/scoreboard/page");
    const element = await Page();
    render(element);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "95");
    expect(screen.getByText(/cyber champion/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/scoreboard/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
