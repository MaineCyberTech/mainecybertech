import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockOnboardingList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    clientOnboarding: { list: mockOnboardingList },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock("@/components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, description, actionLabel, actionHref }: any) =>
    React.createElement(
      "div",
      null,
      React.createElement("h3", null, title),
      React.createElement("p", null, description),
      actionLabel ? React.createElement("a", { href: actionHref }, actionLabel) : null,
    ),
}));

describe("ClientOnboardingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockOnboardingList.mockResolvedValue({ items: [] });
    const { default: Page } =
      await import("@/app/(portal)/portal/client-onboarding-command-center/page");
    const element = await Page();
    render(element);
    expect(
      screen.getByRole("heading", { name: /client onboarding command center/i }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockOnboardingList.mockResolvedValue({ items: [] });
    const { default: Page } =
      await import("@/app/(portal)/portal/client-onboarding-command-center/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockOnboardingList.mockResolvedValue({ items: [] });
    const { default: Page } =
      await import("@/app/(portal)/portal/client-onboarding-command-center/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/no onboarding records yet/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } =
      await import("@/app/(portal)/portal/client-onboarding-command-center/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockOnboardingList.mockResolvedValue({
      items: [
        {
          id: "1",
          client_name: "Test Client",
          status: "discovery",
          phase: "discovery",
          risk_level: "low",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const { default: Page } =
      await import("@/app/(portal)/portal/client-onboarding-command-center/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("Test Client")).toBeInTheDocument();
  });
});
