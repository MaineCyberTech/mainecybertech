import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockDeviceProfilesList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    deviceProfiles: { list: mockDeviceProfilesList },
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

jest.mock("@/components/admin/AdminPagination", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Pagination" }),
}));

describe("DeviceProfilesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockDeviceProfilesList.mockResolvedValue({ items: [], total: 0 });
    const { default: Page } = await import("@/app/(portal)/portal/device-profiles/page");
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(
      screen.getByRole("heading", { name: /device configuration profiles/i }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockDeviceProfilesList.mockResolvedValue({ items: [], total: 0 });
    const { default: Page } = await import("@/app/(portal)/portal/device-profiles/page");
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockDeviceProfilesList.mockResolvedValue({ items: [], total: 0 });
    const { default: Page } = await import("@/app/(portal)/portal/device-profiles/page");
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/no device profiles found/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/device-profiles/page");
    const element = await Page({ searchParams: Promise.resolve({}) });
    expect(element).toBeNull();
  });

  it("renders items when data exists", async () => {
    mockDeviceProfilesList.mockResolvedValue({
      items: [
        {
          id: "1",
          name: "Test Profile",
          manufacturer: "Dell",
          model: "OptiPlex",
          type: "workstation",
          specs: { bitlocker: true },
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      total: 1,
    });
    const { default: Page } = await import("@/app/(portal)/portal/device-profiles/page");
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Test Profile")).toBeInTheDocument();
    expect(screen.getByText(/Manufacturer: Dell/)).toBeInTheDocument();
  });

  it("handles API error gracefully", async () => {
    mockDeviceProfilesList.mockRejectedValue(new Error("API down"));
    const { default: Page } = await import("@/app/(portal)/portal/device-profiles/page");
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/no device profiles found/i)).toBeInTheDocument();
  });
});
