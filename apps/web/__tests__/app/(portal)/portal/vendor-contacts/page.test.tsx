import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockContactsList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    vendors: { contacts: { list: mockContactsList } },
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

describe("PortalVendorContactsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockContactsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/vendor-contacts/page");
    const element = await Page();
    render(element);
    expect(screen.getByRole("heading", { name: /vendor contacts/i })).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockContactsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/vendor-contacts/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockContactsList.mockResolvedValue({ items: [] });
    const { default: Page } = await import("@/app/(portal)/portal/vendor-contacts/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/no vendor contacts found/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } = await import("@/app/(portal)/portal/vendor-contacts/page");
    const element = await Page();
    expect(element).toBeNull();
  });

  it("renders items when data exists", async () => {
    mockContactsList.mockResolvedValue({
      items: [
        {
          id: "1",
          contact_name: "John Doe",
          vendor_name: "Acme Corp",
          is_primary: true,
          email: "john@acme.com",
          phone: "555-0100",
          role_title: "Account Manager",
        },
      ],
    });
    const { default: Page } = await import("@/app/(portal)/portal/vendor-contacts/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
