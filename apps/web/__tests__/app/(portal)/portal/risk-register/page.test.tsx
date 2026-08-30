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
    governance: { risks: { list: mockList } },
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

describe("PortalRiskRegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/risk-register/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /risk register/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/risk-register/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "rk1",
          risk_description: "Phishing vulnerability",
          status: "open",
          risk_category: "security",
          likelihood: "high",
          impact: "high",
          risk_score: 85,
        },
        {
          id: "rk2",
          risk_description: "Legacy firewall EOL",
          status: "mitigated",
          risk_category: "infrastructure",
          likelihood: "medium",
          impact: "medium",
          risk_score: 45,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/risk-register/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Phishing vulnerability")).toBeInTheDocument();
    expect(screen.getByText("Legacy firewall EOL")).toBeInTheDocument();
    expect(screen.getAllByText(/Category:/)).toHaveLength(2);
    expect(screen.getAllByText(/Score:/)).toHaveLength(2);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/risk-register/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No risks recorded.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "rk1",
          risk_description: "Phishing vulnerability",
          status: "open",
          risk_category: "security",
          likelihood: "high",
          impact: "high",
          risk_score: 85,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/risk-register/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("open");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/risk-register/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
