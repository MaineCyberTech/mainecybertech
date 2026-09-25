import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    final: { budgets: { list: mockList } },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createBudget: jest.fn(),
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

describe("BudgetPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/final/budgets/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Budget Roadmap" })).toBeInTheDocument();
    expect(screen.getByText(/Budget items with costs/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/final/budgets/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("final");
  });

  it("renders CrudForm with New Budget Item title", async () => {
    const Page = (await import("@/app/(admin)/admin/final/budgets/page")).default;
    render(await Page());
    expect(screen.getByText("New Budget Item")).toBeInTheDocument();
  });

  it("renders empty state when no budget items", async () => {
    const Page = (await import("@/app/(admin)/admin/final/budgets/page")).default;
    render(await Page());
    expect(screen.getByText("No budget items")).toBeInTheDocument();
  });

  it("renders items list when budgets exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "b1", item_name: "Firewall Upgrade" },
        { id: "b2", item_name: "Server Refresh" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/final/budgets/page")).default;
    render(await Page());
    expect(screen.getByText("Firewall Upgrade")).toBeInTheDocument();
    expect(screen.getByText("Server Refresh")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/final/budgets/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/final/budgets/page")).default;
    render(await Page());
    expect(screen.getByText("No budget items")).toBeInTheDocument();
  });
});
