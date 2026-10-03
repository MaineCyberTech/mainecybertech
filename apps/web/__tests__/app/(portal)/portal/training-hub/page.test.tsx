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
    trainingHub: { courses: { list: mockList } },
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

describe("PortalTrainingHubPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/training-hub/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /training hub/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/training-hub/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "th1",
          title: "Phishing Awareness",
          category: "Security",
          difficulty: "beginner",
          estimated_minutes: 15,
        },
        {
          id: "th2",
          title: "Incident Response",
          category: "Security",
          difficulty: "advanced",
          estimated_minutes: 30,
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/training-hub/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Phishing Awareness")).toBeInTheDocument();
    expect(screen.getByText("Incident Response")).toBeInTheDocument();
    expect(screen.getByText("15 min")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/training-hub/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No courses available.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/training-hub/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
