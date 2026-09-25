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
    securityOps: { offboarding: { list: mockList } },
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

describe("PortalOffboardingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/offboarding/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /offboarding/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/offboarding/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "ob1",
          employee: "John Doe",
          status: "completed",
          department: "Engineering",
          offboard_date: "2026-06-15",
          completed_at: "2026-06-16T00:00:00.000Z",
        },
        {
          id: "ob2",
          employee: "Jane Smith",
          status: "in-progress",
          department: "Marketing",
          offboard_date: "2026-07-01",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/offboarding/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getAllByText(/Department:/)).toHaveLength(2);
    expect(screen.getAllByText(/Offboard date:/)).toHaveLength(2);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/offboarding/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No offboarding records yet.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "ob1",
          employee: "John Doe",
          status: "completed",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/offboarding/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("completed");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/offboarding/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
