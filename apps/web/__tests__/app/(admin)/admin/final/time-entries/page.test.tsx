import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    final: { timeEntries: { list: mockList } },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createTimeEntry: jest.fn(),
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

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("TimeEntryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/final/time-entries/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Time Entry" })).toBeInTheDocument();
    expect(screen.getByText(/Track billable time/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/final/time-entries/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("final");
  });

  it("renders CrudForm with New Time Entry title", async () => {
    const Page = (await import("@/app/(admin)/admin/final/time-entries/page")).default;
    render(await Page());
    expect(screen.getByText("New Time Entry")).toBeInTheDocument();
  });

  it("renders empty state when no time entries", async () => {
    const Page = (await import("@/app/(admin)/admin/final/time-entries/page")).default;
    render(await Page());
    expect(screen.getByText("No time entries")).toBeInTheDocument();
  });

  it("renders items list when entries exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "t1", description: "Firewall configuration" },
        { id: "t2", description: "Server maintenance" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/final/time-entries/page")).default;
    render(await Page());
    expect(screen.getByText("Firewall configuration")).toBeInTheDocument();
    expect(screen.getByText("Server maintenance")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/final/time-entries/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/final/time-entries/page")).default;
    render(await Page());
    expect(screen.getByText("No time entries")).toBeInTheDocument();
  });
});
