import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockOrgsList = jest.fn();
const mockKbList = jest.fn();
const mockRequireAdminAccess = jest.fn().mockResolvedValue(undefined);

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    organizations: { list: mockOrgsList },
    knowledgeBase: { list: mockKbList },
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

describe("AdminKnowledgeBasePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrgsList.mockResolvedValue({ items: [{ id: "org-1", name: "Acme" }] });
    mockKbList.mockResolvedValue({ items: [] });
  });

  it("lists articles with publish state for the default org", async () => {
    mockKbList.mockResolvedValue({
      items: [
        {
          id: "kb1",
          title: "Reset your password",
          category: "Accounts",
          is_published: true,
          updated_at: "2026-09-01T00:00:00Z",
        },
      ],
    });
    const { default: Page } = await import("@/app/(admin)/admin/knowledge-base/page");
    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
      "href",
      "/admin/knowledge-base?organizationId=org-1",
    );
    expect(screen.getByText("Reset your password")).toBeInTheDocument();
    expect(screen.getByText("published")).toBeInTheDocument();
    expect(mockKbList).toHaveBeenCalledWith({ organizationId: "org-1", limit: 50 });
  });

  it("shows the empty state", async () => {
    const { default: Page } = await import("@/app/(admin)/admin/knowledge-base/page");
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/no knowledge base articles/i)).toBeInTheDocument();
  });
});
