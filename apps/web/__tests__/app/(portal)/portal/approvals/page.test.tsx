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
    approvals: { list: mockList },
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

describe("PortalApprovalsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/approvals/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /approvals/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/approvals/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "a1",
          request_subject: "New Firewall Rule",
          status: "pending",
          priority: "high",
          request_type: "network",
          requested_by: "John Doe",
        },
        {
          id: "a2",
          request_subject: "VPN Access",
          status: "approved",
          priority: "normal",
          request_type: "access",
          requested_by: "Jane Smith",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/approvals/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("New Firewall Rule")).toBeInTheDocument();
    expect(screen.getByText("VPN Access")).toBeInTheDocument();
    expect(screen.getByText("Type: network")).toBeInTheDocument();
    expect(screen.getByText("Type: access")).toBeInTheDocument();
    expect(screen.getByText("By: John Doe")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/approvals/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No approval requests found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/approvals/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
