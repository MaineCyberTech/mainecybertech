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
    securityOps: { onboarding: { list: mockList } },
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

describe("PortalSecurityOpsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/security-ops/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /security operations/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/security-ops/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "so1",
          client_name: "Acme Corp",
          discovery_complete: true,
          m365_setup_complete: false,
          handoff_complete: true,
          status: "active",
        },
        {
          id: "so2",
          client_name: "Beta Inc",
          discovery_complete: false,
          m365_setup_complete: true,
          handoff_complete: false,
          status: "draft",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/security-ops/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
    expect(screen.getAllByText("Yes")).toHaveLength(3);
    expect(screen.getAllByText("No")).toHaveLength(3);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/security-ops/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No onboarding records found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/security-ops/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
