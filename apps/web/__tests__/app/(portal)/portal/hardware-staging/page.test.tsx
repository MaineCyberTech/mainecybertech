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
    staging: { list: mockList },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock("@/components/StatusPill", () => ({
  __esModule: true,
  default: ({ status }: { status: string }) =>
    React.createElement("span", { "data-testid": "status-pill" }, status),
}));

jest.mock("@/components/admin/AdminPagination", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "data-testid": "pagination" }),
}));

describe("PortalHardwareStagingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [], total: 0 });

    const { default: Page } = await import("@/app/(portal)/portal/hardware-staging/page");
    const element = await Page({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByRole("heading", { name: /hardware staging/i })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "s1", device_name: "Dell OptiPlex 7090", asset_tag: "TAG-1", status: "pending" },
      ],
      total: 1,
    });

    const { default: Page } = await import("@/app/(portal)/portal/hardware-staging/page");
    const element = await Page({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByText("Dell OptiPlex 7090")).toBeInTheDocument();
    expect(screen.getByText(/Tag: TAG-1/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [], total: 0 });

    const { default: Page } = await import("@/app/(portal)/portal/hardware-staging/page");
    const element = await Page({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByText("No hardware staging items.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/hardware-staging/page");
    const element = await Page({ searchParams: Promise.resolve({}) });

    expect(element).toBeNull();
  });
});
