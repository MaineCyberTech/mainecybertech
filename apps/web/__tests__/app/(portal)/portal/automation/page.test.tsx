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
    eduAutomation: { automation: { list: mockList } },
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

describe("PortalAutomationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /automation workflows/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "a1",
          name: "Ticket Auto-Close",
          status: "active",
          trigger_type: "scheduled",
          frequency: "daily",
          last_run: "2026-07-26T00:00:00.000Z",
        },
        {
          id: "a2",
          name: "User Provisioning",
          status: "paused",
          trigger_type: "event",
          frequency: "realtime",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Ticket Auto-Close")).toBeInTheDocument();
    expect(screen.getByText("User Provisioning")).toBeInTheDocument();
    expect(screen.getAllByText(/Trigger:/)).toHaveLength(2);
    expect(screen.getAllByText(/Frequency:/)).toHaveLength(2);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No automation workflows configured.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "a1",
          name: "Ticket Auto-Close",
          status: "active",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("active");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
