import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockList = jest.fn();
const mockChangesList = jest.fn().mockResolvedValue({ items: [] });
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    cab: { list: mockList },
    governance: { changes: { list: mockChangesList } },
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

describe("PortalCabPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockList.mockResolvedValue({ items: [] });
    mockChangesList.mockResolvedValue({ items: [] });
  });

  it("renders heading", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /change advisory board/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders meetings when data exists", async () => {
    mockList.mockResolvedValue({
      items: [
        {
          id: "m1",
          scheduled_at: "2026-09-01T15:00:00Z",
          status: "scheduled",
          notes: "Q3 review",
          agenda: [
            {
              id: "a1",
              meeting_id: "m1",
              change_request_id: "00000000-0000-0000-0000-0000000000aa",
              decision: "approved",
            },
          ],
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Q3 review")).toBeInTheDocument();
    expect(screen.getByText(/Agenda \(1\)/)).toBeInTheDocument();
    const pills = screen.getAllByTestId("status-pill");
    expect(pills.some((p) => p.textContent === "scheduled")).toBe(true);
    expect(pills.some((p) => p.textContent === "approved")).toBe(true);
  });

  it("shows empty state", async () => {
    mockList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No CAB meetings scheduled.")).toBeInTheDocument();
  });

  it("renders pending change requests", async () => {
    mockList.mockResolvedValue({ items: [] });
    mockChangesList.mockResolvedValue({
      items: [{ id: "cr1", title: "Firewall rule update", status: "pending", priority: "high" }],
    });

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Firewall rule update")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/cab/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
