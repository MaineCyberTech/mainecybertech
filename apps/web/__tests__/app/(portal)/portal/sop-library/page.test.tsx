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
    governance: { sopLibrary: { list: mockList } },
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

describe("PortalSopLibraryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/sop-library/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /sop library/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/sop-library/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "sop1",
          title: "Incident Response Plan",
          status: "published",
          category: "Security",
          version: "2.1",
        },
        {
          id: "sop2",
          title: "New Hire Onboarding",
          status: "draft",
          category: "HR",
          version: "1.0",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/sop-library/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Incident Response Plan")).toBeInTheDocument();
    expect(screen.getByText("New Hire Onboarding")).toBeInTheDocument();
    expect(screen.getAllByText(/Category:/)).toHaveLength(2);
    expect(screen.getAllByText(/Version:/)).toHaveLength(2);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/sop-library/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No SOPs available yet.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "sop1",
          title: "Incident Response Plan",
          status: "published",
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/sop-library/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("published");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/sop-library/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
