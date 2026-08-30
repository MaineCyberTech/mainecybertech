import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockStatusPublic = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    batch: { status: { public: mockStatusPublic } },
  }),
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock("@/components/portal/PortalSubnav", () => ({
  __esModule: true,
  default: () => React.createElement("nav", null),
}));

describe("PortalStatusPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders heading", async () => {
    mockStatusPublic.mockResolvedValue([]);
    const { default: Page } = await import("@/app/(portal)/portal/status/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /service status/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockStatusPublic.mockResolvedValue([]);
    const { default: Page } = await import("@/app/(portal)/portal/status/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows all systems operational when no incidents", async () => {
    mockStatusPublic.mockResolvedValue([]);
    const { default: Page } = await import("@/app/(portal)/portal/status/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/all systems operational/i)).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockStatusPublic.mockResolvedValue([
      {
        id: "1",
        title: "Network Maintenance",
        description: "Scheduled maintenance",
        severity: "maintenance",
        scheduled_start: "2026-06-01T00:00:00Z",
      },
    ]);
    const { default: Page } = await import("@/app/(portal)/portal/status/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("Network Maintenance")).toBeInTheDocument();
  });

  it("handles API error gracefully", async () => {
    mockStatusPublic.mockRejectedValue(new Error("API down"));
    const { default: Page } = await import("@/app/(portal)/portal/status/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/all systems operational/i)).toBeInTheDocument();
  });
});
