import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockOffboardingList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    securityOps: { offboarding: { list: mockOffboardingList } },
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
  createOffboarding: jest.fn(),
}));

describe("OffboardingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockOffboardingList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/offboarding/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "M365 Offboarding Safety Checklist" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Guided offboarding/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/offboarding/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("offboarding");
  });

  it("renders empty state when no offboardings", async () => {
    const Page = (await import("@/app/(admin)/admin/offboarding/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No offboarding checklists");
  });

  it("renders offboarding items when they exist", async () => {
    mockOffboardingList.mockResolvedValue({
      items: [
        {
          id: "of1",
          employee_name: "John Doe",
          offboarding_date: "2026-07-01",
          account_disabled: true,
          mailbox_converted: false,
          license_reclaimed: false,
          access_reviewed: true,
          evidence_collected: false,
          status: "active",
        },
        {
          id: "of2",
          employee_name: "Jane Smith",
          offboarding_date: null,
          account_disabled: false,
          mailbox_converted: false,
          license_reclaimed: false,
          access_reviewed: false,
          evidence_collected: false,
          status: "pending",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/offboarding/page")).default;
    render(await Page());
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("shows checklist status emojis", async () => {
    mockOffboardingList.mockResolvedValue({
      items: [
        {
          id: "of1",
          employee_name: "Test User",
          offboarding_date: "2026-07-01",
          account_disabled: true,
          mailbox_converted: false,
          license_reclaimed: true,
          access_reviewed: false,
          evidence_collected: false,
          status: "active",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/offboarding/page")).default;
    render(await Page());
    expect(screen.getByText(/Disabled/)).toBeInTheDocument();
    expect(screen.getByText(/License/)).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/offboarding/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockOffboardingList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/offboarding/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No offboarding checklists");
  });
});
