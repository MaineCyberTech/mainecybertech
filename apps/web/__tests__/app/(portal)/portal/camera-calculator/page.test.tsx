import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockCameraList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    fieldServices: { camera: { list: mockCameraList } },
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

describe("PortalCameraCalculatorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockCameraList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/camera-calculator/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /camera storage calculator/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockCameraList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/camera-calculator/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockCameraList.mockResolvedValue({
      items: [
        {
          id: "c1",
          name: "Main Office",
          status: "active",
          camera_count: 16,
          total_storage_gb: 2000,
          retention_days: 30,
          calculated_at: new Date().toISOString(),
        },
        {
          id: "c2",
          name: "Warehouse",
          status: "active",
          camera_count: 8,
          total_storage_gb: 1000,
          retention_days: 60,
          calculated_at: new Date().toISOString(),
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/camera-calculator/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Main Office")).toBeInTheDocument();
    expect(screen.getByText("Warehouse")).toBeInTheDocument();
    expect(screen.getByText(/Cameras: 16/)).toBeInTheDocument();
    expect(screen.getByText(/Cameras: 8/)).toBeInTheDocument();
    expect(screen.getByText(/2000 GB/)).toBeInTheDocument();
    expect(screen.getByText(/1000 GB/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockCameraList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/camera-calculator/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No camera calculations available.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockCameraList.mockResolvedValue({
      items: [
        {
          id: "c1",
          name: "Main Office",
          status: "active",
          camera_count: 16,
          total_storage_gb: 2000,
          retention_days: 30,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/camera-calculator/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("active");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/camera-calculator/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
