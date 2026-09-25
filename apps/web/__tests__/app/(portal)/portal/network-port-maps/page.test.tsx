import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockPortMapsList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    fieldServices: { portMaps: { list: mockPortMapsList } },
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

describe("PortalNetworkPortMapsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockPortMapsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/network-port-maps/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /network port maps/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockPortMapsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/network-port-maps/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockPortMapsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          switch_name: "Core Switch",
          port_number: 1,
          vlan_id: 10,
          vlan_name: "Management",
          speed: "1G",
          poe_enabled: true,
          uplink: false,
          connected_device: "Firewall",
        },
        {
          id: "p2",
          switch_name: "Edge Switch",
          port_number: 24,
          vlan_id: 20,
          speed: "10G",
          poe_enabled: false,
          uplink: true,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/network-port-maps/page");
    const element = await Page();
    render(element);

    expect(screen.getByText(/Core Switch : port 1/)).toBeInTheDocument();
    expect(screen.getByText(/Edge Switch : port 24/)).toBeInTheDocument();
    expect(screen.getByText(/VLAN 10 \(Management\)/)).toBeInTheDocument();
    expect(screen.getByText(/VLAN 20/)).toBeInTheDocument();
    expect(screen.getByText(/Connected device: Firewall/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockPortMapsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/network-port-maps/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No port maps available.")).toBeInTheDocument();
  });

  it("flags PoE and uplink ports", async () => {
    mockPortMapsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          switch_name: "Core Switch",
          port_number: 5,
          speed: "1G",
          poe_enabled: true,
          uplink: true,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/network-port-maps/page");
    const element = await Page();
    render(element);

    expect(screen.getByText(/PoE/)).toBeInTheDocument();
    expect(screen.getByText(/Uplink/)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/network-port-maps/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
