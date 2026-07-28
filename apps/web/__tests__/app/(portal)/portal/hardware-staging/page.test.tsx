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
    fieldServices: { staging: { list: mockList } },
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

describe("PortalHardwareStagingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/hardware-staging/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /hardware staging/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/hardware-staging/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "hs1",
          hardware_name: "Dell OptiPlex 7090",
          status: "staged",
          hardware_type: "Workstation",
          assigned_to: "Engineering Dept",
        },
        {
          id: "hs2",
          hardware_name: "Cisco Catalyst 9200",
          status: "pending",
          hardware_type: "Switch",
          assigned_to: "Unassigned",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/hardware-staging/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Dell OptiPlex 7090")).toBeInTheDocument();
    expect(screen.getByText("Cisco Catalyst 9200")).toBeInTheDocument();
    expect(screen.getAllByText(/Type:/)).toHaveLength(2);
    expect(screen.getAllByText(/Assigned:/)).toHaveLength(2);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/hardware-staging/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No hardware staging items.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "hs1",
          hardware_name: "Dell OptiPlex 7090",
          status: "staged",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/hardware-staging/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("staged");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/hardware-staging/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
