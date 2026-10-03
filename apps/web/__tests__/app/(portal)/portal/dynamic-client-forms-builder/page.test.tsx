import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockFormsList = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    dynamicForms: { list: mockFormsList },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock("@/components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, description, actionLabel, actionHref }: any) =>
    React.createElement(
      "div",
      null,
      React.createElement("h3", null, title),
      React.createElement("p", null, description),
      actionLabel ? React.createElement("a", { href: actionHref }, actionLabel) : null,
    ),
}));

describe("DynamicFormsListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
  });

  it("renders heading", async () => {
    mockFormsList.mockResolvedValue({ items: [] });
    const { default: Page } =
      await import("@/app/(portal)/portal/dynamic-client-forms-builder/page");
    const element = await Page();
    render(element);
    expect(
      screen.getByRole("heading", { name: /dynamic client forms builder/i }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs", async () => {
    mockFormsList.mockResolvedValue({ items: [] });
    const { default: Page } =
      await import("@/app/(portal)/portal/dynamic-client-forms-builder/page");
    const element = await Page();
    render(element);
    expect(screen.getAllByRole("navigation").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty state", async () => {
    mockFormsList.mockResolvedValue({ items: [] });
    const { default: Page } =
      await import("@/app/(portal)/portal/dynamic-client-forms-builder/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/no forms yet/i)).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);
    const { default: Page } =
      await import("@/app/(portal)/portal/dynamic-client-forms-builder/page");
    const element = await Page();
    render(element);
    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockFormsList.mockResolvedValue({
      items: [
        {
          id: "1",
          title: "Test Form",
          description: "A test form",
          form_type: "intake",
          status: "published",
          fields: [],
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const { default: Page } =
      await import("@/app/(portal)/portal/dynamic-client-forms-builder/page");
    const element = await Page();
    render(element);
    expect(screen.getByText("Test Form")).toBeInTheDocument();
  });
});
