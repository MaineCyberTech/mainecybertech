import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockBackupsList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    final: { backups: { list: mockBackupsList } },
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

describe("PortalBackupDrPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockBackupsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/backup-dr/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("heading", { name: /backup/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockBackupsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/backup-dr/page");
    const element = await Page();
    render(element);

    expect(screen.getByRole("navigation", { "aria-label": "Breadcrumb" })).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockBackupsList.mockResolvedValue({
      items: [
        {
          id: "b1",
          name: "Daily Server Backup",
          status: "completed",
          type: "full",
          target: "S3",
          last_run: new Date().toISOString(),
        },
        {
          id: "b2",
          name: "Database Backup",
          status: "running",
          type: "incremental",
          target: "Azure",
          last_run: new Date().toISOString(),
        },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/backup-dr/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("Daily Server Backup")).toBeInTheDocument();
    expect(screen.getByText("Database Backup")).toBeInTheDocument();
    expect(screen.getByText(/Type: full/)).toBeInTheDocument();
    expect(screen.getByText(/Type: incremental/)).toBeInTheDocument();
    expect(screen.getByText(/Target: S3/)).toBeInTheDocument();
    expect(screen.getByText(/Target: Azure/)).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    mockBackupsList.mockResolvedValue({ items: [] });

    const { default: Page } = await import("@/app/(portal)/portal/backup-dr/page");
    const element = await Page();
    render(element);

    expect(screen.getByText("No backup jobs configured.")).toBeInTheDocument();
  });

  it("renders status pills", async () => {
    mockBackupsList.mockResolvedValue({
      items: [
        { id: "b1", name: "Daily Server Backup", status: "completed", type: "full", target: "S3" },
      ],
    });

    const { default: Page } = await import("@/app/(portal)/portal/backup-dr/page");
    const element = await Page();
    render(element);

    const pills = screen.getAllByTestId("status-pill");
    expect(pills).toHaveLength(1);
    expect(pills[0]).toHaveTextContent("completed");
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: Page } = await import("@/app/(portal)/portal/backup-dr/page");
    const element = await Page();

    expect(element).toBeNull();
  });
});
