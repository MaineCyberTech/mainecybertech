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
          name: "Core Switch",
          status: "active",
          port_count: 48,
          protocol: "TCP",
          last_scanned: new Date().toISOString(),
        },
        {
          id: "p2",
          name: "Edge Router",
          status: "active",
          port_count: 24,
          protocol: "UDP",
          last_scanned: new Date().toISOString(),
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/network-port-maps/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Core Switch")).toBeInTheDocument();
    expect(screen.getByText("Edge Router")).toBeInTheDocument();
    expect(screen.getByText(/Ports: 48/)).toBeInTheDocument();
    expect(screen.getByText(/Ports: 24/)).toBeInTheDocument();
    expect(screen.getByText(/Protocol: TCP/)).toBeInTheDocument();
    expect(screen.getByText(/Protocol: UDP/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockPortMapsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/network-port-maps/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No port maps available.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockPortMapsList.mockResolvedValue({
      items: [{ id: "p1", name: "Core Switch", status: "active", port_count: 48, protocol: "TCP" }],
    });

    const { default: Page } = await import("@/app/(portal)/portal/network-port-maps/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("active");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/network-port-maps/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
