import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockOrgsList = jest.fn();
const mockCabList = jest.fn();
const mockChangesList = jest.fn();
const mockRequireAdminAccess = jest.fn().mockResolvedValue(undefined);

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    organizations: { list: mockOrgsList },
    cab: { list: mockCabList },
    governance: { changes: { list: mockChangesList } },
  }),
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: mockRequireAdminAccess,
}));

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

jest.mock("@/components/cab/CabMeetingsClient", () => ({
  __esModule: true,
  default: ({ organizationId }: { organizationId: string }) =>
    React.createElement("div", { "data-testid": "cab-client" }, organizationId),
}));

describe("AdminCabPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrgsList.mockResolvedValue({ items: [{ id: "org-1", name: "Acme" }] });
    mockCabList.mockResolvedValue({ items: [] });
    mockChangesList.mockResolvedValue({ items: [] });
  });

  it("renders the org picker and the CAB client for the default org", async () => {
    const { default: Page } = await import("@/app/(admin)/admin/cab/page");
    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
      "href",
      "/admin/cab?organizationId=org-1",
    );
    expect(screen.getByTestId("cab-client")).toHaveTextContent("org-1");
    expect(mockCabList).toHaveBeenCalledWith({ organizationId: "org-1" });
  });

  it("uses the organizationId from search params", async () => {
    mockOrgsList.mockResolvedValue({
      items: [
        { id: "org-1", name: "Acme" },
        { id: "org-2", name: "Beta" },
      ],
    });
    const { default: Page } = await import("@/app/(admin)/admin/cab/page");
    render(await Page({ searchParams: Promise.resolve({ organizationId: "org-2" }) }));

    expect(screen.getByTestId("cab-client")).toHaveTextContent("org-2");
    expect(mockCabList).toHaveBeenCalledWith({ organizationId: "org-2" });
  });

  it("shows an empty message when there are no organizations", async () => {
    mockOrgsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(admin)/admin/cab/page");
    render(await Page({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText(/no organizations available/i)).toBeInTheDocument();
  });
});
