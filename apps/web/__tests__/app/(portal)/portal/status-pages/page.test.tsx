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
    statusPage: { components: { list: mockList } },
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

describe("PortalStatusPagesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/status-pages/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /status page/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/status-pages/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "sp1",
          name: "Web Portal",
          component_type: "Web Application",
          status: "operational",
        },
        {
          id: "sp2",
          name: "Email Service",
          component_type: "Email",
          status: "degraded",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/status-pages/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Web Portal")).toBeInTheDocument();
    expect(screen.getByText("Email Service")).toBeInTheDocument();
    expect(screen.getByText("Web Application")).toBeInTheDocument();
    expect(screen.getByText("operational")).toBeInTheDocument();
    expect(screen.getByText("degraded")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/status-pages/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No status components defined.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/status-pages/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
