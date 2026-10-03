import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockUnifiList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    fieldServices: { unifi: { list: mockUnifiList } },
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

describe("PortalUnifiSiteSurveysPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockUnifiList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/unifi-site-surveys/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /unifi site surveys/i })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockUnifiList.mockResolvedValue({
      items: [
        {
          id: "u1",
          site_name: "Main Office",
          site_address: "123 Main St",
          access_points: 6,
          switches: 2,
          cameras: 4,
          outdoor_aps: 1,
          cable_runs_estimated: 12,
          poe_budget_watts: 150,
          nvr_estimated_storage_tb: 4,
          survey_date: "2026-05-01",
          status: "draft",
        },
      ],
    });
    const { default: Page } = await import("@/app/(portal)/portal/unifi-site-surveys/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("Main Office")).toBeInTheDocument();
    expect(screen.getByText(/APs: 6/)).toBeInTheDocument();
    expect(screen.getByText(/PoE budget: 150 W/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockUnifiList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/unifi-site-surveys/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("No site surveys available.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/unifi-site-surveys/page");
    const element = await Page();
    expect(element).toBeNull();
  });
});
