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
    governance: { changes: { list: mockList } },
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

describe("PortalChangeRequestsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/change-requests/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /change requests/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/change-requests/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "cr1",
          title: "Firewall rule update",
          status: "approved",
          priority: "high",
          change_type: "standard",
        },
        {
          id: "cr2",
          title: "VPN config change",
          status: "pending",
          priority: "medium",
          change_type: "emergency",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/change-requests/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Firewall rule update")).toBeInTheDocument();
    expect(screen.getByText("VPN config change")).toBeInTheDocument();
    expect(screen.getAllByText(/Priority:/)).toHaveLength(2);
    expect(screen.getAllByText(/Type:/)).toHaveLength(2);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/change-requests/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No change requests yet.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "cr1",
          title: "Firewall rule update",
          status: "approved",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/change-requests/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("approved");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/change-requests/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
