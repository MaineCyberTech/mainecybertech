import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockGet = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

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
    securitySuite: { incidents: { get: mockGet } },
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

jest.mock(
  "@/components/StatusPill",
  () => ({
    __esModule: true,
    default: ({ status }: { status: string }) =>
      React.createElement("span", { "data-testid": "status-pill" }, status),
  }),
  { virtual: true },
);

const INCIDENT = {
  id: "inc-1",
  incident_type: "Ransomware",
  title: "Ransomware on file server",
  severity: "critical",
  status: "contained",
  description: "Files encrypted on FS01.",
  affected_systems: "FS01, backups",
  root_cause: "Unpatched RDP exposure",
  lessons_learned: "Disable RDP externally",
  detected_at: "2026-06-01T10:00:00Z",
  contained_at: "2026-06-01T14:00:00Z",
  eradicated_at: null,
  recovered_at: null,
  closed_at: null,
};

async function renderPage() {
  const { default: Page } = await import("@/app/(portal)/portal/incident-response/[id]/page");
  render(await Page({ params: Promise.resolve({ id: "inc-1" }) }));
}

describe("PortalIncidentDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders the incident with its response lifecycle", async () => {
    mockGet.mockResolvedValue(INCIDENT);
    await renderPage();

    expect(screen.getByRole("heading", { name: /ransomware on file server/i })).toBeInTheDocument();
    expect(screen.getByText(/Severity: critical/)).toBeInTheDocument();
    expect(screen.getByText(/Unpatched RDP exposure/)).toBeInTheDocument();
    expect(screen.getByText(/Disable RDP externally/)).toBeInTheDocument();
    expect(screen.getByText(/2026-06-01 14:00 UTC/)).toBeInTheDocument();
  });

  it("calls notFound when the incident cannot be loaded", async () => {
    mockGet.mockRejectedValue(new Error("404"));
    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders nothing without an approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/incident-response/[id]/page");
    expect(await Page({ params: Promise.resolve({ id: "inc-1" }) })).toBeNull();
  });
});
