import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockPhishingList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    eduAutomation: { phishing: { list: mockPhishingList } },
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

describe("PortalPhishingSimulationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockPhishingList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/phishing-simulations/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /phishing simulations/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockPhishingList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/phishing-simulations/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockPhishingList.mockResolvedValue({
      items: [
        {
          id: "p1",
          name: "March 2026 Campaign",
          status: "completed",
          sent_count: 500,
          clicked_count: 23,
          reported_count: 45,
          completed_at: new Date().toISOString(),
        },
        {
          id: "p2",
          name: "April 2026 Campaign",
          status: "running",
          sent_count: 500,
          clicked_count: 12,
          reported_count: 30,
          completed_at: null,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/phishing-simulations/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("March 2026 Campaign")).toBeInTheDocument();
    expect(screen.getByText("April 2026 Campaign")).toBeInTheDocument();
    expect(screen.getAllByText(/Sent: 500/)).toHaveLength(2);
    expect(screen.getByText(/Clicked: 23/)).toBeInTheDocument();
    expect(screen.getByText(/Reported: 45/)).toBeInTheDocument();
    expect(screen.getByText(/Clicked: 12/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockPhishingList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/phishing-simulations/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No phishing simulations yet.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockPhishingList.mockResolvedValue({
      items: [
        {
          id: "p1",
          name: "March 2026 Campaign",
          status: "completed",
          sent_count: 500,
          clicked_count: 23,
          reported_count: 45,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/phishing-simulations/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("completed");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/phishing-simulations/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
