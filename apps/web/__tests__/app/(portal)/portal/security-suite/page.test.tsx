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
    securitySuite: { m365: { list: mockList } },
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

describe("PortalSecuritySuitePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/security-suite/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /security suite/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/security-suite/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "ss1",
          tenant_domain: "acme.com",
          mfa_enforced: true,
          conditional_access_configured: true,
          legacy_auth_blocked: false,
          overall_score: 85,
          status: "active",
        },
        {
          id: "ss2",
          tenant_domain: "beta.org",
          mfa_enforced: false,
          conditional_access_configured: false,
          legacy_auth_blocked: true,
          overall_score: 45,
          status: "draft",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/security-suite/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("acme.com")).toBeInTheDocument();
    expect(screen.getByText("beta.org")).toBeInTheDocument();
    expect(screen.getByText("Score: 85")).toBeInTheDocument();
    expect(screen.getByText("Score: 45")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/security-suite/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No M365 hardening records found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/security-suite/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
