import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockKbList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    eduAutomation: { kb: { list: mockKbList } },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

describe("PortalKnowledgeBasePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockKbList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/client-knowledge-base/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /knowledge base/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockKbList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/client-knowledge-base/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockKbList.mockResolvedValue({
      items: [
        {
          id: "k1",
          title: "Password Policy",
          category: "security",
          is_published: true,
          content: "Use strong passwords with 12+ characters.",
        },
        {
          id: "k2",
          title: "VPN Setup Guide",
          category: "networking",
          is_published: true,
          content: "How to configure VPN access.",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/client-knowledge-base/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Password Policy")).toBeInTheDocument();
    expect(screen.getByText("VPN Setup Guide")).toBeInTheDocument();
    expect(screen.getByText(/Category: security/i)).toBeInTheDocument();
    expect(screen.getByText(/Category: networking/i)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockKbList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/client-knowledge-base/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No knowledge base articles yet.")).toBeInTheDocument();
  });

  it("renders published status for items", async () => {
    mockKbList.mockResolvedValue({
      items: [
        {
          id: "k1",
          title: "Password Policy",
          category: "security",
          is_published: true,
          content: "Use strong passwords.",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/client-knowledge-base/page");
    const element = await Page();
    render(element);

    expect(screen.getByText(/Published: Yes/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/client-knowledge-base/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
