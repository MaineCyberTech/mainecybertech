import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockProjectsList = jest.fn();
const mockListTasks = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    projects: { list: mockProjectsList, listTasks: mockListTasks },
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

jest.mock("@/components/portal/ProjectTimelineView", () => ({
  __esModule: true,
  default: () => React.createElement("div", { "data-testid": "timeline-view" }),
}));

jest.mock("@/components/portal/ProjectCalendarView", () => ({
  __esModule: true,
  default: () => React.createElement("div", { "data-testid": "calendar-view" }),
}));

describe("PortalTimelinePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockProjectsList.mockResolvedValue({ items: [] });
    mockListTasks.mockResolvedValue([]);
  });

  it("renders heading", async () => {
    const { default: Page } = await import("@/app/(portal)/portal/timeline/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /project timeline/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const { default: Page } = await import("@/app/(portal)/portal/timeline/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/timeline/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
  });

  it("renders stats when projects exist", async () => {
    mockProjectsList.mockResolvedValue({ items: [{ id: "p1", name: "Project 1" }] });
    mockListTasks.mockResolvedValue([
      { id: "t1", title: "Task 1", due_at: "2026-12-01T00:00:00Z" },
    ]);
    const { default: Page } = await import("@/app/(portal)/portal/timeline/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByText(/project/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders timeline and calendar views", async () => {
    const { default: Page } = await import("@/app/(portal)/portal/timeline/page");
    const element = await Page();
    render(element);
    expect(screen.getByTestId("timeline-view")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-view")).toBeInTheDocument();
  });
});



