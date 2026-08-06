import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    final: { procurement: { list: mockList } },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createProcurement: jest.fn(),
}));

jest.mock("@/app/(admin)/admin/final/procurement/ProcurementCompareClient", () => ({
  __esModule: true,
  default: () => <div data-testid="procurement-compare" />,
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

describe("ProcurementPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/final/procurement/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Procurement" })).toBeInTheDocument();
    expect(screen.getByText(/Vendor quotes with competitor/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/final/procurement/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("final");
  });

  it("renders CrudForm with New Procurement title", async () => {
    const Page = (await import("@/app/(admin)/admin/final/procurement/page")).default;
    render(await Page());
    expect(screen.getByText("New Procurement")).toBeInTheDocument();
  });

  it("renders empty state when no procurement records", async () => {
    const Page = (await import("@/app/(admin)/admin/final/procurement/page")).default;
    render(await Page());
    expect(screen.getByText("No procurement records")).toBeInTheDocument();
  });

  it("renders items list when procurement records exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "p1", vendor_name: "Acme Corp" },
        { id: "p2", vendor_name: "TechWare" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/final/procurement/page")).default;
    render(await Page());
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("TechWare")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/final/procurement/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/final/procurement/page")).default;
    render(await Page());
    expect(screen.getByText("No procurement records")).toBeInTheDocument();
  });
});
