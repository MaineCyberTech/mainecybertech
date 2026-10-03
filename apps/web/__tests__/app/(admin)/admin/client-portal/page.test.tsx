import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockOrgsList = jest.fn();
const mockRequireAdminAccess = jest.fn().mockResolvedValue(undefined);

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    organizations: { list: mockOrgsList },
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
jest.mock("@/app/(admin)/admin/client-portal/ClientPortalEntitlementsForm", () => ({
  __esModule: true,
  default: ({ organizationId }: { organizationId: string }) =>
    React.createElement("div", { "data-testid": "entitlements-form" }, organizationId),
}));

describe("AdminClientPortalPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrgsList.mockResolvedValue({ items: [{ id: "org-1", name: "Acme" }] });
  });

  it("renders the org picker and the entitlements form", async () => {
    const { default: Page } = await import("@/app/(admin)/admin/client-portal/page");
    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
      "href",
      "/admin/client-portal?organizationId=org-1",
    );
    expect(screen.getByTestId("entitlements-form")).toHaveTextContent("org-1");
  });

  it("shows an empty message with no organizations", async () => {
    mockOrgsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(admin)/admin/client-portal/page");
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/no organizations available/i)).toBeInTheDocument();
  });
});
