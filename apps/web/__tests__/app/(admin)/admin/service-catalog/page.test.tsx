import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockServiceCatalogList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    serviceCatalog: { list: mockServiceCatalogList },
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
  createService: jest.fn(),
}));

describe("ServiceCatalogPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockServiceCatalogList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/service-catalog/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Client Billing Service Catalog" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Define recurring services/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/service-catalog/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("service-catalog");
  });

  it("renders empty state when no services", async () => {
    const Page = (await import("@/app/(admin)/admin/service-catalog/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No services defined");
  });

  it("renders services grouped by category", async () => {
    mockServiceCatalogList.mockResolvedValue({
      items: [
        {
          id: "s1",
          name: "Antivirus",
          description: null,
          category: "security",
          billing_model: "per_user",
          unit: "user",
          base_price: 5,
          is_bundled: false,
          is_active: true,
        },
        {
          id: "s2",
          name: "Backup",
          description: null,
          category: "backup",
          billing_model: "per_gb",
          unit: "gb",
          base_price: 0.1,
          is_bundled: true,
          is_active: true,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/service-catalog/page")).default;
    render(await Page());
    expect(screen.getByText("Antivirus")).toBeInTheDocument();
    expect(screen.getByText("Backup")).toBeInTheDocument();
    expect(screen.getByText(/security/)).toBeInTheDocument();
  });

  it("shows active badge for services", async () => {
    mockServiceCatalogList.mockResolvedValue({
      items: [
        {
          id: "s1",
          name: "DNS Filter",
          description: null,
          category: "security",
          billing_model: "per_user",
          unit: "user",
          base_price: 3,
          is_bundled: false,
          is_active: true,
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/service-catalog/page")).default;
    render(await Page());
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/service-catalog/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockServiceCatalogList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/service-catalog/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toHaveTextContent("No services defined");
  });
});
