import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockList = jest.fn();
const mockGet = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });
const mockRequireAdminAccess = jest.fn().mockRejectedValue(new Error("forbidden"));

jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    findings: { list: mockList, get: mockGet },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock("@/components/portal/PortalSubnav", () => ({
  __esModule: true,
  default: () => React.createElement("nav", null),
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

jest.mock("@/components/admin/SeverityPill", () => ({
  __esModule: true,
  SeverityPill: ({ severity }: { severity: string }) =>
    React.createElement("span", { "data-testid": "severity-pill" }, severity),
}));

describe("PortalFindingsPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders finding cards as links to the detail page", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "f1",
          title: "Open RDP port",
          source: "scan",
          status: "open",
          severity: "p1",
          description: "Exposed RDP",
        },
      ],
    });
    const { default: Page } = await import("@/app/(portal)/portal/findings/page");
    render(await Page());

    const link = screen.getByText("Open RDP port").closest("a");
    expect(link).toHaveAttribute("href", "/portal/findings/f1");
  });

  it("shows the empty state", async () => {
    mockList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/findings/page");
    render(await Page());
    expect(screen.getByText(/no findings reported/i)).toBeInTheDocument();
  });
});

describe("PortalFindingDetailPage", () => {
  beforeEach(() => jest.clearAllMocks());

  const FINDING = {
    id: "f1",
    title: "Open RDP port",
    description: "RDP exposed to the internet.",
    severity: "p1",
    status: "in_progress",
    source: "scan",
    finding_category: "Network",
    remediation_plan: "Restrict RDP to VPN.",
    remediation_deadline: "2026-10-01T00:00:00Z",
    verification_steps: "Re-run external scan.",
    verified_at: null,
    affected_systems: "GW-01",
    controls_impacted: "AC-17",
    resolved_at: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z",
  };

  async function renderDetail() {
    const { default: Page } = await import("@/app/(portal)/portal/findings/[id]/page");
    render(await Page({ params: Promise.resolve({ id: "f1" }) }));
  }

  it("renders the finding with remediation detail", async () => {
    mockGet.mockResolvedValue(FINDING);
    await renderDetail();

    expect(screen.getByRole("heading", { name: /open rdp port/i })).toBeInTheDocument();
    expect(screen.getByText("p1")).toBeInTheDocument();
    expect(screen.getByText("in_progress")).toBeInTheDocument();
    expect(screen.getByText(/Restrict RDP to VPN/)).toBeInTheDocument();
    expect(screen.getByText(/Re-run external scan/)).toBeInTheDocument();
    expect(screen.getByText("2026-10-01")).toBeInTheDocument();
  });

  it("calls notFound when the finding cannot be loaded", async () => {
    mockGet.mockRejectedValue(Object.assign(new Error("404"), { status: 404 }));
    await expect(renderDetail()).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
