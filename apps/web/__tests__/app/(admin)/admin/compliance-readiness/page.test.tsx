import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockOrgsList = jest.fn();
const mockListFrameworks = jest.fn();
const mockListControls = jest.fn();
const mockRequireAdminAccess = jest.fn().mockResolvedValue(undefined);

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    organizations: { list: mockOrgsList },
    compliance: { listFrameworks: mockListFrameworks, listControls: mockListControls },
  }),
}));

jest.mock("@/lib/auth/admin", () => ({ requireAdminAccess: mockRequireAdminAccess }));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));
jest.mock("@/components/admin/AdminSubnav", () => ({
  __esModule: true,
  default: () => React.createElement("nav", null),
}));
jest.mock("@/components/admin/AdminPageShell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
}));
jest.mock("@/components/admin/CrudForm", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => React.createElement("button", null, title),
}));

describe("AdminComplianceReadinessPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrgsList.mockResolvedValue({ items: [{ id: "org-1", name: "Acme" }] });
    mockListFrameworks.mockResolvedValue([]);
    mockListControls.mockResolvedValue([]);
  });

  it("renders frameworks with their controls", async () => {
    mockListFrameworks.mockResolvedValue([
      { id: "fw1", name: "NIST 800-53", description: "Federal baseline" },
    ]);
    mockListControls.mockResolvedValue([
      { id: "c1", title: "AC-2 Account Management", status: "implemented" },
    ]);

    const { default: Page } = await import("@/app/(admin)/admin/compliance-readiness/page");
    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("NIST 800-53")).toBeInTheDocument();
    expect(screen.getByText("AC-2 Account Management")).toBeInTheDocument();
    expect(screen.getByText("implemented")).toBeInTheDocument();
    expect(mockListControls).toHaveBeenCalledWith("fw1", "org-1");
  });

  it("shows the empty state when there are no frameworks", async () => {
    const { default: Page } = await import("@/app/(admin)/admin/compliance-readiness/page");
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/no frameworks defined/i)).toBeInTheDocument();
  });
});
