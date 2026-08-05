import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockNetworkDiagramsList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    fieldServices: { networkDiagrams: { list: mockNetworkDiagramsList } },
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

describe("PortalNetworkDiagramsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockNetworkDiagramsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/network-diagrams/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /network diagrams/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockNetworkDiagramsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/network-diagrams/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockNetworkDiagramsList.mockResolvedValue({
      items: [
        {
          id: "n1",
          site_name: "Main Campus",
          status: "published",
          device_count: 25,
          vlan_count: 8,
          wan_count: 2,
          wireless_zones: 3,
          camera_zones: 4,
          updated_at: new Date().toISOString(),
        },
        {
          id: "n2",
          site_name: "Branch Office",
          status: "draft",
          device_count: 10,
          vlan_count: 4,
          wan_count: 1,
          wireless_zones: 1,
          camera_zones: 0,
          updated_at: new Date().toISOString(),
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/network-diagrams/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Main Campus")).toBeInTheDocument();
    expect(screen.getByText("Branch Office")).toBeInTheDocument();
    expect(screen.getByText(/Devices: 25/)).toBeInTheDocument();
    expect(screen.getByText(/VLANs: 8/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockNetworkDiagramsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/network-diagrams/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No network diagrams available.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockNetworkDiagramsList.mockResolvedValue({
      items: [
        {
          id: "n1",
          site_name: "Main Campus",
          status: "published",
          device_count: 25,
          vlan_count: 8,
          wan_count: 2,
          wireless_zones: 3,
          camera_zones: 4,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/network-diagrams/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("published");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/network-diagrams/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
