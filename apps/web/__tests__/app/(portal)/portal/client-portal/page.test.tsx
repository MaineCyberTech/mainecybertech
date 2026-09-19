import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockGetBootstrap = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn() },
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    clientPortal: { getBootstrap: mockGetBootstrap },
  }),
}));

jest.mock("@/components/Breadcrumbs", () => ({
  __esModule: true,
  default: () => React.createElement("nav", { "aria-label": "Breadcrumb" }),
}));

jest.mock("@/components/portal/PortalSubnav", () => ({
  __esModule: true,
  default: () => React.createElement("nav", null),
}));

jest.mock("@/components/EmptyState", () => ({
  __esModule: true,
  default: () => React.createElement("div", { "data-testid": "empty-state" }),
}));

const sampleBootstrap = {
  profile: { fullName: "Jane Doe", email: "jane@example.com" },
  memberships: [
    {
      organizationId: "org-1",
      organizationName: "Acme Corp",
      roleKey: "client_admin",
      roleName: "Client Admin",
      status: "approved",
      subscription: { status: "active", planName: "Growth", currentPeriodEnd: "2027-01-01T00:00:00Z" },
      enabledModules: ["dashboard", "support", "documents", "findings"],
    },
  ],
};

describe("ClientPortalOverviewPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBootstrap.mockResolvedValue(sampleBootstrap);
  });

  it("renders page heading", async () => {
    const Page = (await import("@/app/(portal)/portal/client-portal/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Client Portal Overview" })).toBeInTheDocument();
  });

  it("renders profile summary", async () => {
    const Page = (await import("@/app/(portal)/portal/client-portal/page")).default;
    render(await Page());
    expect(screen.getByText(/Welcome, Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/jane@example\.com/)).toBeInTheDocument();
  });

  it("renders organization, role, and subscription", async () => {
    const Page = (await import("@/app/(portal)/portal/client-portal/page")).default;
    render(await Page());
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText(/Client Admin/)).toBeInTheDocument();
    expect(screen.getByText(/Subscription: active \(Growth\)/)).toBeInTheDocument();
  });

  it("renders enabled modules", async () => {
    const Page = (await import("@/app/(portal)/portal/client-portal/page")).default;
    render(await Page());
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText("findings")).toBeInTheDocument();
  });

  it("renders empty state when no memberships", async () => {
    mockGetBootstrap.mockResolvedValue({
      profile: { fullName: null, email: null },
      memberships: [],
    });
    const Page = (await import("@/app/(portal)/portal/client-portal/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("handles API error gracefully", async () => {
    mockGetBootstrap.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(portal)/portal/client-portal/page")).default;
    render(await Page());
    expect(screen.getByText("Client Portal Overview")).toBeInTheDocument();
  });
});
