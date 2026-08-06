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
    securityOps: { breakGlass: { list: mockList } },
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

describe("PortalBreakGlassPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/break-glass/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /break glass accounts/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/break-glass/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "bg1",
          account_name: "emergency-admin",
          status: "active",
          system: "Azure AD",
          custodian_name: "Admin",
          last_used_at: "2026-07-20",
        },
        {
          id: "bg2",
          account_name: "root-backup",
          status: "expired",
          system: "AWS",
          custodian_name: "Ops",
          last_used_at: "2026-01-15",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/break-glass/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("emergency-admin")).toBeInTheDocument();
    expect(screen.getByText("root-backup")).toBeInTheDocument();
    expect(screen.getAllByText(/System:/)).toHaveLength(2);
    expect(screen.getAllByText(/Last used:/)).toHaveLength(2);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/break-glass/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No break glass accounts registered.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "bg1",
          account_name: "emergency-admin",
          status: "active",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/break-glass/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("active");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/break-glass/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
