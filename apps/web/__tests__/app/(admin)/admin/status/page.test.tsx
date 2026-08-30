import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockStatusList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    batch: { status: { list: mockStatusList } },
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
  createStatusItem: jest.fn(),
}));

describe("StatusPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockStatusList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/status/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Public Status & Maintenance Notices" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Publish maintenance windows/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/status/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("status");
  });

  it("renders empty state when no notices", async () => {
    const Page = (await import("@/app/(admin)/admin/status/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No status notices");
  });

  it("renders status items when they exist", async () => {
    mockStatusList.mockResolvedValue({
      items: [
        {
          id: "st1",
          title: "Scheduled Maintenance",
          description: "Server update tonight",
          severity: "maintenance",
          is_public: true,
          is_resolved: false,
        },
        {
          id: "st2",
          title: "Email Outage Resolved",
          description: null,
          severity: "critical",
          is_public: false,
          is_resolved: true,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/status/page")).default;
    render(await Page());
    expect(screen.getByText("Scheduled Maintenance")).toBeInTheDocument();
    expect(screen.getByText("Email Outage Resolved")).toBeInTheDocument();
  });

  it("shows Public badge for public items", async () => {
    mockStatusList.mockResolvedValue({
      items: [
        {
          id: "st1",
          title: "Maintenance",
          description: null,
          severity: "maintenance",
          is_public: true,
          is_resolved: false,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/status/page")).default;
    render(await Page());
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/status/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockStatusList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/status/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No status notices");
  });
});
