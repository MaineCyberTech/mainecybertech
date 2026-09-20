import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockGet = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    final: { runbooks: { get: mockGet } },
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

jest.mock(
  "@/components/StatusPill",
  () => ({
    __esModule: true,
    default: ({ status }: { status: string }) =>
      React.createElement("span", { "data-testid": "status-pill" }, status),
  }),
  { virtual: true },
);

const RUNBOOK = {
  id: "rb-1",
  title: "Incident Response Runbook",
  category: "Security",
  content: "Step 1: isolate\nStep 2: notify",
  version: "2.1",
  status: "active",
  last_reviewed_at: "2026-08-01T00:00:00Z",
  next_review_at: "2027-02-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
};

async function renderPage() {
  const { default: Page } = await import("@/app/(portal)/portal/runbooks/[id]/page");
  render(await Page({ params: Promise.resolve({ id: "rb-1" }) }));
}

describe("PortalRunbookDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders the runbook title, metadata and procedure", async () => {
    mockGet.mockResolvedValue(RUNBOOK);
    await renderPage();

    expect(screen.getByRole("heading", { name: /incident response runbook/i })).toBeInTheDocument();
    expect(screen.getByText(/Category: Security/)).toBeInTheDocument();
    expect(screen.getByText("2.1")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText(/Step 1: isolate/)).toBeInTheDocument();
  });

  it("shows a placeholder when no procedure content exists", async () => {
    mockGet.mockResolvedValue({ ...RUNBOOK, content: null });
    await renderPage();

    expect(screen.getByText(/no procedure content has been published/i)).toBeInTheDocument();
  });

  it("calls notFound when the runbook cannot be loaded", async () => {
    mockGet.mockRejectedValue(new Error("404"));
    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders nothing without an approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/runbooks/[id]/page");
    expect(await Page({ params: Promise.resolve({ id: "rb-1" }) })).toBeNull();
  });
});
