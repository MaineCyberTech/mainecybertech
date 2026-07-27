import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockAssetsList = jest.fn();
const mockAssetsStats = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    assets: { list: mockAssetsList, stats: mockAssetsStats },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createAsset: jest.fn(),
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

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crudform">{title}</div>;
  };
});

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const emptyStats = { byType: {}, total: 0, expiringWarranty: 0 };

describe("AssetsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockAssetsList.mockResolvedValue({ items: [] });
    mockAssetsStats.mockResolvedValue(emptyStats);
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/assets/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Asset & Warranty Tracker" })).toBeInTheDocument();
    expect(screen.getByText(/Hardware register with warranties/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/assets/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("assets");
  });

  it("renders stat pills with zero counts", async () => {
    const Page = (await import("@/app/(admin)/admin/assets/page")).default;
    render(await Page());
    expect(screen.getByText("0 Total")).toBeInTheDocument();
    expect(screen.getByText("0 Warranty Expiring")).toBeInTheDocument();
  });

  it("renders CrudForm for new asset", async () => {
    const Page = (await import("@/app/(admin)/admin/assets/page")).default;
    render(await Page());
    expect(screen.getByTestId("crudform")).toHaveTextContent("New Asset");
  });

  it("renders empty state when no assets", async () => {
    const Page = (await import("@/app/(admin)/admin/assets/page")).default;
    render(await Page());
    expect(screen.getByText("No assets registered")).toBeInTheDocument();
  });

  it("renders assets list when assets exist", async () => {
    mockAssetsList.mockResolvedValue({
      items: [
        { id: "a1", name: "Dell PowerEdge R750", asset_type: "server", status: "active", make: "Dell", model: "R750", warranty_expires: "2028-01-01", created_at: "2026-01-01T00:00:00Z" },
      ],
    });
    mockAssetsStats.mockResolvedValue({ byType: { server: 1 }, total: 1, expiringWarranty: 0 });
    const Page = (await import("@/app/(admin)/admin/assets/page")).default;
    render(await Page());
    expect(screen.getByText("Dell PowerEdge R750")).toBeInTheDocument();
    expect(screen.getByText(/Dell R750/)).toBeInTheDocument();
  });

  it("renders with warranty info when present", async () => {
    mockAssetsList.mockResolvedValue({
      items: [
        { id: "a1", name: "Server 1", asset_type: "server", status: "active", make: "HP", model: "DL360", warranty_expires: "2028-06-15", created_at: "2026-01-01T00:00:00Z" },
      ],
    });
    mockAssetsStats.mockResolvedValue({ byType: {}, total: 1, expiringWarranty: 0 });
    const Page = (await import("@/app/(admin)/admin/assets/page")).default;
    render(await Page());
    expect(screen.getByText(/Warranty:/)).toBeInTheDocument();
  });

  it("shows non-zero stats", async () => {
    mockAssetsStats.mockResolvedValue({ byType: { laptop: 5 }, total: 5, expiringWarranty: 2 });
    const Page = (await import("@/app/(admin)/admin/assets/page")).default;
    render(await Page());
    expect(screen.getByText("5 Total")).toBeInTheDocument();
    expect(screen.getByText("2 Warranty Expiring")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/assets/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockAssetsList.mockRejectedValue(new Error("API down"));
    mockAssetsStats.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/assets/page")).default;
    render(await Page());
    expect(screen.getByText("No assets registered")).toBeInTheDocument();
  });
});
