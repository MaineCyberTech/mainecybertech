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
          name: "Q1 2026",
          status: "assessed",
          score: 78,
          category: "Overall",
          assessed_at: new Date().toISOString(),
        },
        {
          id: "s2",
          name: "Q2 2026",
          status: "pending",
          score: null,
          category: "Overall",
          assessed_at: null,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/scoreboard/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Q1 2026")).toBeInTheDocument();
    expect(screen.getByText("Q2 2026")).toBeInTheDocument();
    expect(screen.getByText(/Score: 78%/)).toBeInTheDocument();
    expect(screen.getByText(/Score: N\/A/)).toBeInTheDocument();
    expect(screen.getAllByText(/Category: Overall/)).toHaveLength(2);
  });

  it("shows empty state", async () => {
    mockScorecardsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/scoreboard/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No scorecards available.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockScorecardsList.mockResolvedValue({
      items: [{ id: "s1", name: "Q1 2026", status: "assessed", score: 78, category: "Overall" }],
    });

    const { default: Page } = await import("@/app/(portal)/portal/scoreboard/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("assessed");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/scoreboard/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
