import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockIncidentsList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    securitySuite: { incidents: { list: mockIncidentsList } },
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

describe("PortalIncidentResponsePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockIncidentsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/incident-response/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /incident response/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockIncidentsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/incident-response/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockIncidentsList.mockResolvedValue({
      items: [
        {
          id: "i1",
          title: "Ransomware Attack",
          status: "active",
          incident_type: "malware",
          severity: "critical",
          detected_at: new Date().toISOString(),
        },
        {
          id: "i2",
          title: "Phishing Campaign",
          status: "resolved",
          incident_type: "phishing",
          severity: "high",
          detected_at: new Date().toISOString(),
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/incident-response/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Ransomware Attack")).toBeInTheDocument();
    expect(screen.getByText("Phishing Campaign")).toBeInTheDocument();
    expect(screen.getByText(/malware/)).toBeInTheDocument();
    expect(screen.getByText(/Severity: critical/i)).toBeInTheDocument();
    expect(screen.getByText(/Severity: high/i)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockIncidentsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/incident-response/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No incidents recorded.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockIncidentsList.mockResolvedValue({
      items: [
        {
          id: "i1",
          title: "Ransomware Attack",
          status: "active",
          incident_type: "malware",
          severity: "critical",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/incident-response/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("active");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/incident-response/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
