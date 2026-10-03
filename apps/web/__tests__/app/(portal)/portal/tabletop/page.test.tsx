import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    governance: { tabletop: { list: mockList } },
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

describe("PortalTabletopPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/tabletop/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /tabletop exercises/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/tabletop/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "tt1",
          title: "Ransomware Simulation",
          status: "completed",
          scenario: "Ransomware attack",
          participants: "12",
        },
        {
          id: "tt2",
          title: "Phishing Incident",
          status: "scheduled",
          scenario: "Spear phishing campaign",
          participants: "8",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/tabletop/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Ransomware Simulation")).toBeInTheDocument();
    expect(screen.getByText("Phishing Incident")).toBeInTheDocument();
    expect(screen.getAllByText(/Scenario:/)).toHaveLength(2);
    expect(screen.getAllByText(/Participants:/)).toHaveLength(2);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/tabletop/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No tabletop exercises scheduled.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "tt1",
          title: "Ransomware Simulation",
          status: "completed",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/tabletop/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("completed");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/tabletop/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
