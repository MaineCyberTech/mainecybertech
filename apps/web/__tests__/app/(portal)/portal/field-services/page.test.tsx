import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockIspList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    fieldServices: { isp: { list: mockIspList } },
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

describe("FieldServicesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockIspList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/field-services/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /field services/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockIspList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/field-services/page");
    const element = await Page();
    render(element);

    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("renders ISP assessments when data exists", async () => {
    mockIspList.mockResolvedValue({
      items: [
        {
          id: "f1",
          site_name: "HQ Office",
          provider: "Comcast",
          speed_tier: "1 Gbps",
          monthly_cost: 500,
          contract_end: "2027-06-01T00:00:00Z",
          status: "active",
        },
        {
          id: "f2",
          site_name: "Branch Office",
          provider: "Verizon",
          speed_tier: "500 Mbps",
          monthly_cost: 300,
          status: "expired",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/field-services/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("HQ Office")).toBeInTheDocument();
    expect(screen.getByText("Branch Office")).toBeInTheDocument();
    expect(screen.getByText(/Provider: Comcast/)).toBeInTheDocument();
    expect(screen.getByText(/Provider: Verizon/)).toBeInTheDocument();
    expect(screen.getByText(/Speed: 1 Gbps/)).toBeInTheDocument();
    expect(screen.getByText(/Speed: 500 Mbps/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockIspList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/field-services/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No ISP assessments found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/field-services/page");
    const element = await Page();

    expect(element).toBeNull();
  });

  it("displays status badges", async () => {
    mockIspList.mockResolvedValue({
      items: [
        {
          id: "f1",
          site_name: "HQ",
          provider: "Comcast",
          speed_tier: "1 Gbps",
          monthly_cost: 500,
          status: "active",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/field-services/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
