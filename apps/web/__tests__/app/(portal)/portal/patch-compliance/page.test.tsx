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
    securityOps: { patchCompliance: { list: mockList } },
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

describe("PortalPatchCompliancePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/patch-compliance/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /patch compliance/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/patch-compliance/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "pc1",
          device_name: "WORK-LT-001",
          compliance_status: "compliant",
          patches_pending: 0,
          critical_patches: 0,
        },
        {
          id: "pc2",
          device_name: "SRV-DB-01",
          compliance_status: "non-compliant",
          patches_pending: 12,
          critical_patches: 3,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/patch-compliance/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("WORK-LT-001")).toBeInTheDocument();
    expect(screen.getByText("SRV-DB-01")).toBeInTheDocument();
    expect(screen.getAllByText(/Patches pending:/)).toHaveLength(2);
    expect(screen.getAllByText(/Critical:/)).toHaveLength(2);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/patch-compliance/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No patch compliance data available.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "pc1",
          device_name: "WORK-LT-001",
          compliance_status: "compliant",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/patch-compliance/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("compliant");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/patch-compliance/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
