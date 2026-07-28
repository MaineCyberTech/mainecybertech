import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockTimeEntriesList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    final: { timeEntries: { list: mockTimeEntriesList } },
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

describe("PortalTimeEntriesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockTimeEntriesList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/time-entries/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /time entries/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockTimeEntriesList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/time-entries/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders time entries when data exists", async () => {
    mockTimeEntriesList.mockResolvedValue({
      items: [
        {
          id: "t1",
          description: "Server maintenance",
          hours: 3.5,
          work_date: "2026-07-01T00:00:00Z",
          ticket_id: "TICKET-123",
          billable: true,
        },
        {
          id: "t2",
          description: "Meeting with client",
          hours: 1.0,
          work_date: "2026-07-02T00:00:00Z",
          billable: false,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/time-entries/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Server maintenance")).toBeInTheDocument();
    expect(screen.getByText("Meeting with client")).toBeInTheDocument();
    expect(screen.getByText(/Billable/)).toBeInTheDocument();
    expect(screen.getByText(/Non-billable/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockTimeEntriesList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/time-entries/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No time entries found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/time-entries/page");
    const element = await Page();

    expect(element).toBeNull();
  });

  it("displays hours formatted", async () => {
    mockTimeEntriesList.mockResolvedValue({
      items: [
        {
          id: "t1",
          description: "Server maintenance",
          hours: 2.0,
          work_date: "2026-07-01T00:00:00Z",
          billable: true,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/time-entries/page");
    const element = await Page();
    render(element);

    expect(screen.getByText(/2.0h/)).toBeInTheDocument();
  });
});
