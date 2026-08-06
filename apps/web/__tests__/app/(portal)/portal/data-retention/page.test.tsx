import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockRetentionList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    governance: { retention: { list: mockRetentionList } },
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

describe("PortalDataRetentionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockRetentionList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/data-retention/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /data retention policies/i })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockRetentionList.mockResolvedValue({
      items: [
        {
          id: "r1",
          data_category: "Client Records",
          system_name: "CRM",
          retention_period_days: 365,
          disposal_method: "shred",
          is_regulated: true,
          regulation_reference: "PCI",
          next_review_at: "2026-12-01T00:00:00Z",
          status: "active",
        },
      ],
    });
    const { default: Page } = await import("@/app/(portal)/portal/data-retention/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("Client Records")).toBeInTheDocument();
    expect(screen.getByText(/Retention: 365 days/)).toBeInTheDocument();
    expect(screen.getByText(/Regulated: Yes \(PCI\)/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockRetentionList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/data-retention/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("No retention policies available.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/data-retention/page");
    const element = await Page();
    expect(element).toBeNull();
  });
});
