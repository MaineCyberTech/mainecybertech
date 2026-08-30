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
    dmarcCoach: { list: mockList },
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

describe("PortalDmarcCoachPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/dmarc-coach/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /dmarc coach/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/dmarc-coach/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "dc1",
          domain: "acme.com",
          issues_count: 3,
          overall_grade: "B",
        },
        {
          id: "dc2",
          domain: "beta.org",
          issues_count: 8,
          overall_grade: "D",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/dmarc-coach/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("acme.com")).toBeInTheDocument();
    expect(screen.getByText("beta.org")).toBeInTheDocument();
    expect(screen.getByText("3 issues found")).toBeInTheDocument();
    expect(screen.getByText("8 issues found")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/dmarc-coach/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No DMARC analyses yet.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/dmarc-coach/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
