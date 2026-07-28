import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockOnboardingList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    securityOps: { onboarding: { list: mockOnboardingList } },
  }),
}));

jest.mock("@/components/Breadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

jest.mock("@/components/EmptyState", () => {
  return function MockEmptyState({ title }: any) {
    return <div data-testid="empty-state">{title}</div>;
  };
});

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crud-form">{title}</div>;
  };
});

jest.mock("@/lib/module-actions", () => ({
  createOnboarding: jest.fn(),
}));

describe("OnboardingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockOnboardingList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/onboarding/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Client Onboarding Command Center" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Repeatable workspace/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/onboarding/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("onboarding");
  });

  it("renders empty state when no onboardings", async () => {
    const Page = (await import("@/app/(admin)/admin/onboarding/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No onboardings");
  });

  it("renders onboarding items when they exist", async () => {
    mockOnboardingList.mockResolvedValue({
      items: [
        {
          id: "o1",
          client_name: "Acme Corp",
          discovery_complete: true,
          m365_setup_complete: false,
          security_baseline_applied: false,
          handoff_complete: false,
          status: "active",
        },
        {
          id: "o2",
          client_name: "Beta Inc",
          discovery_complete: true,
          m365_setup_complete: true,
          security_baseline_applied: true,
          handoff_complete: false,
          status: "active",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/onboarding/page")).default;
    render(await Page());
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Beta Inc")).toBeInTheDocument();
  });

  it("shows checklist status emojis", async () => {
    mockOnboardingList.mockResolvedValue({
      items: [
        {
          id: "o1",
          client_name: "Test Co",
          discovery_complete: true,
          m365_setup_complete: false,
          security_baseline_applied: true,
          handoff_complete: false,
          status: "active",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/onboarding/page")).default;
    render(await Page());
    expect(screen.getByText(/Discovery/)).toBeInTheDocument();
    expect(screen.getAllByText(/M365/).length).toBeGreaterThanOrEqual(1);
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/onboarding/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockOnboardingList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/onboarding/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No onboardings");
  });
});
