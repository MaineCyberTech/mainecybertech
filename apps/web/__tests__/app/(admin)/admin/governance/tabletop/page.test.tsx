import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    governance: { tabletop: { list: mockList } },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createTabletop: jest.fn(),
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

describe("TabletopPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/tabletop/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Tabletop Exercise" })).toBeInTheDocument();
    expect(screen.getByText(/Plan tabletop exercises/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/tabletop/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("governance");
  });

  it("renders CrudForm with New Tabletop Exercise title", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/tabletop/page")).default;
    render(await Page());
    expect(screen.getByText("New Tabletop Exercise")).toBeInTheDocument();
  });

  it("renders empty state when no tabletop exercises", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/tabletop/page")).default;
    render(await Page());
    expect(screen.getByText("No tabletop exercises")).toBeInTheDocument();
  });

  it("renders items list when exercises exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "t1", title: "Ransomware Response" },
        { id: "t2", title: "Data Breach Drill" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/governance/tabletop/page")).default;
    render(await Page());
    expect(screen.getByText("Ransomware Response")).toBeInTheDocument();
    expect(screen.getByText("Data Breach Drill")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/tabletop/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/governance/tabletop/page")).default;
    render(await Page());
    expect(screen.getByText("No tabletop exercises")).toBeInTheDocument();
  });
});
