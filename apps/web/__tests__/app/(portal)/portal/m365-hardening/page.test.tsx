import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockM365List = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    securitySuite: { m365: { list: mockM365List } },
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

describe("PortalM365HardeningPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockM365List.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/m365-hardening/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /m365 security/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockM365List.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/m365-hardening/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockM365List.mockResolvedValue({
      items: [
        {
          id: "m1",
          tenant_domain: "contoso.com",
          status: "compliant",
          mfa_enforced: true,
          conditional_access_configured: true,
          legacy_auth_blocked: true,
          overall_score: 92,
        },
        {
          id: "m2",
          tenant_domain: "fabrikam.com",
          status: "non-compliant",
          mfa_enforced: false,
          conditional_access_configured: false,
          legacy_auth_blocked: true,
          overall_score: 45,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/m365-hardening/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("contoso.com")).toBeInTheDocument();
    expect(screen.getByText("fabrikam.com")).toBeInTheDocument();
    expect(screen.getByText("Score: 92%")).toBeInTheDocument();
    expect(screen.getByText("Score: 45%")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockM365List.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/m365-hardening/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No M365 hardening checks available.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockM365List.mockResolvedValue({
      items: [
        {
          id: "m1",
          tenant_domain: "contoso.com",
          status: "compliant",
          mfa_enforced: true,
          conditional_access_configured: true,
          legacy_auth_blocked: true,
          overall_score: 92,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/m365-hardening/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("compliant");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/m365-hardening/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
