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

jest.mock("@/app/(portal)/portal/camera-calculator/CameraCalculatorClient", () => ({
  __esModule: true,
  default: ({ initialItems }: { initialItems: Array<Record<string, unknown>> }) =>
    React.createElement(
      "div",
      { "data-testid": "camera-calculator-client" },
      React.createElement(
        "div",
        null,
        (initialItems as Array<Record<string, unknown>>).map((a) =>
          React.createElement("p", { key: String(a.id) }, String(a.site_name)),
        ),
      ),
    ),
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

  it("renders the client calculator with items when data exists", async () => {
    mockCameraList.mockResolvedValue({
      items: [
        {
          id: "c1",
          site_name: "Main Office",
          status: "active",
          camera_count: 16,
          estimated_storage_tb: 2,
          retention_days: 30,
          created_at: new Date().toISOString(),
        },
        {
          id: "c2",
          site_name: "Warehouse",
          status: "active",
          camera_count: 8,
          estimated_storage_tb: 1,
          retention_days: 60,
          created_at: new Date().toISOString(),
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/camera-calculator/page");
    const element = await Page();
    render(element);

    expect(screen.getByTestId("camera-calculator-client")).toBeInTheDocument();
    expect(screen.getByText("Main Office")).toBeInTheDocument();
    expect(screen.getByText("Warehouse")).toBeInTheDocument();
  });

  it("shows empty state via client", async () => {
    mockCameraList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/camera-calculator/page");
    const element = await Page();
    render(element);

    expect(screen.getByTestId("camera-calculator-client")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/camera-calculator/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
