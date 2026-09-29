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

    expect(
      screen.getByRole("heading", { level: 1, name: /automation workflows/i }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items using the real automation_workflows fields", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "a1",
          name: "Ticket Auto-Close",
          is_active: true,
          trigger_type: "scheduled",
          script_type: "powershell",
          last_run_status: "success",
          last_run_at: "2026-07-26T00:00:00.000Z",
        },
        {
          id: "a2",
          name: "User Provisioning",
          is_active: false,
          trigger_type: "event",
          script_type: "python",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Ticket Auto-Close")).toBeInTheDocument();
    expect(screen.getByText("User Provisioning")).toBeInTheDocument();
    expect(screen.getAllByText(/Trigger:/)).toHaveLength(2);
    expect(screen.getAllByText(/Script:/)).toHaveLength(2);
    expect(screen.getAllByText(/Last run:/)).toHaveLength(1);
    expect(screen.queryByText(/Frequency:/)).not.toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No automation workflows configured.")).toBeInTheDocument();
  });

  it("renders the last-run status pill and falls back to is_active", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "a1",
          name: "Ticket Auto-Close",
          is_active: true,
          last_run_status: "success",
        },
        {
          id: "a2",
          name: "User Provisioning",
          is_active: false,
        },
        {
          id: "a3",
          name: "Asset Sync",
          is_active: true,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(3);
    expect(pills[0]).toHaveTextContent("success");
    expect(pills[1]).toHaveTextContent("inactive");
    expect(pills[2]).toHaveTextContent("active");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/automation/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
