import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockFileRequestsList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    fileRequests: { list: mockFileRequestsList },
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

describe("PortalFileRequestsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockFileRequestsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/file-requests/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /secure file requests/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockFileRequestsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/file-requests/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockFileRequestsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/file-requests/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/no active file request links/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/file-requests/page");
    const element = await Page();
    expect(element).toBeNull();
  });

  it("renders items when data exists", async () => {
    mockFileRequestsList.mockResolvedValue({
      items: [
        {
          id: "1",
          title: "Test Request",
          description: "Please upload",
          status: "active",
          upload_count: 2,
          max_files: 5,
          expires_at: "2026-06-01T00:00:00Z",
        },
      ],
    });
    const { default: Page } = await import("@/app/(portal)/portal/file-requests/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("Test Request")).toBeInTheDocument();
  });
});
