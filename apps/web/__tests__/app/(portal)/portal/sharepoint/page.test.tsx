import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockSharepointList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    final: { sharepoint: { list: mockSharepointList } },
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

describe("SharePointPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockSharepointList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/sharepoint/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /sharepoint & teams/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockSharepointList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/sharepoint/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders configurations when data exists", async () => {
    mockSharepointList.mockResolvedValue({
      items: [
        {
          id: "s1",
          title: "Marketing Site",
          description: "Public facing SharePoint site",
          status: "active",
          created_at: "2026-01-15T00:00:00Z",
        },
        {
          id: "s2",
          name: "HR Portal",
          status: "draft",
          created_at: "2026-02-01T00:00:00Z",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/sharepoint/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Marketing Site")).toBeInTheDocument();
    expect(screen.getByText("HR Portal")).toBeInTheDocument();
    expect(screen.getByText("Public facing SharePoint site")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockSharepointList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/sharepoint/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No SharePoint configurations found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/sharepoint/page");
    const element = await Page();

    expect(element).toBeNull();
  });

  it("displays status pills", async () => {
    mockSharepointList.mockResolvedValue({
      items: [
        {
          id: "s1",
          title: "Marketing Site",
          status: "active",
          created_at: new Date().toISOString(),
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/sharepoint/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
