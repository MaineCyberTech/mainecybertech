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
    securitySuite: { endpoints: { list: mockList } },
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

describe("PortalEndpointSecurityPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/endpoint-security/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /endpoint security/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/endpoint-security/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "ep1",
          device_group: "Workstations",
          status: "active",
          total_endpoints: 50,
          av_installed: 48,
          disk_encrypted: 45,
          mdm_enrolled: 42,
          coverage_pct: 84,
        },
        {
          id: "ep2",
          device_group: "Servers",
          status: "active",
          total_endpoints: 20,
          av_installed: 12,
          disk_encrypted: 15,
          mdm_enrolled: 5,
          coverage_pct: 60,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/endpoint-security/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Workstations")).toBeInTheDocument();
    expect(screen.getByText("Servers")).toBeInTheDocument();
    expect(screen.getByText(/Total endpoints: 50/)).toBeInTheDocument();
    expect(screen.getByText(/Total endpoints: 20/)).toBeInTheDocument();
    expect(screen.getByText(/Coverage: 84%/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/endpoint-security/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No endpoints registered.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "ep1",
          device_group: "Workstations",
          status: "active",
          total_endpoints: 50,
          av_installed: 48,
          disk_encrypted: 45,
          mdm_enrolled: 42,
          coverage_pct: 84,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/endpoint-security/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("active");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/endpoint-security/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
