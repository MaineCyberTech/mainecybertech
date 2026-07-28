import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockEduComplianceList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    eduAutomation: { compliance: { list: mockEduComplianceList } },
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

describe("EduAutomationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockEduComplianceList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/edu-automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /education automation/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockEduComplianceList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/edu-automation/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders compliance records when data exists", async () => {
    mockEduComplianceList.mockResolvedValue({
      items: [
        {
          id: "e1",
          title: "SOC 2 Training",
          description: "Annual security awareness training",
          status: "active",
          created_at: "2026-01-15T00:00:00Z",
        },
        {
          id: "e2",
          name: "HIPAA Refresher",
          status: "draft",
          created_at: "2026-02-01T00:00:00Z",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/edu-automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("SOC 2 Training")).toBeInTheDocument();
    expect(screen.getByText("HIPAA Refresher")).toBeInTheDocument();
    expect(screen.getByText("Annual security awareness training")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockEduComplianceList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/edu-automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No compliance records found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/edu-automation/page");
    const element = await Page();

    expect(element).toBeNull();
  });

  it("displays status pills", async () => {
    mockEduComplianceList.mockResolvedValue({
      items: [
        {
          id: "e1",
          title: "Training Module",
          status: "active",
          created_at: new Date().toISOString(),
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/edu-automation/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
