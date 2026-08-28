import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockListFrameworks = jest.fn();
const mockListControls = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    compliance: {
      listFrameworks: mockListFrameworks,
      listControls: mockListControls,
    },
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

describe("PortalComplianceReadinessPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockListFrameworks.mockResolvedValue([]);
    mockListControls.mockResolvedValue([]);
  });

  it("renders heading", async () => {
    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /compliance readiness/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders frameworks and controls when data exists", async () => {
    mockListFrameworks.mockResolvedValue([
      { id: "f1", name: "SOC 2", description: "Security framework", created_at: "2026-01-01T00:00:00Z" },
    ]);
    mockListControls.mockResolvedValue([
      {
        id: "c1",
        framework_id: "f1",
        organization_id: "org-1",
        title: "Access Control Policy",
        status: "implemented",
        owner: "Alice",
        due_at: "2026-12-31T00:00:00Z",
        notes: null,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "c2",
        framework_id: "f1",
        organization_id: "org-1",
        title: "Risk Assessment",
        status: "not_started",
        owner: null,
        due_at: null,
        notes: null,
        created_at: "2026-01-01T00:00:00Z",
      },
    ]);

    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("SOC 2")).toBeInTheDocument();
    expect(screen.getByText("Access Control Policy")).toBeInTheDocument();
    expect(screen.getByText("Risk Assessment")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows empty state", async () => {
    mockListFrameworks.mockResolvedValue([]);

    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No compliance frameworks yet.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockListFrameworks.mockResolvedValue([
      { id: "f1", name: "SOC 2", description: null, created_at: "2026-01-01T00:00:00Z" },
    ]);
    mockListControls.mockResolvedValue([
      {
        id: "c1",
        framework_id: "f1",
        organization_id: "org-1",
        title: "Access Control Policy",
        status: "implemented",
        owner: "Alice",
        due_at: null,
        notes: null,
        created_at: "2026-01-01T00:00:00Z",
      },
    ]);

    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills.length).toBeGreaterThanOrEqual(1);
    expect(pills.some((p) => p.textContent === "implemented")).toBe(true);
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/compliance-readiness/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
