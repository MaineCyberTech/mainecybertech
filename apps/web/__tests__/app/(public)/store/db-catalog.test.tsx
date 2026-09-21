import { render, screen } from "@testing-library/react";

const getApiClient = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => getApiClient(),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("next/navigation", () => ({
  usePathname: () => "/store",
}));

jest.mock("@/components/store/StoreProductCard", () => {
  return function MockProductCard({ name, slug }: { name: string; slug: string }) {
    return (
      <div data-testid="product-card">
        <a href={`/store/${slug}`}>{name}</a>
      </div>
    );
  };
});

jest.mock("@/components/store/StoreCategoryCard", () => {
  return function MockCategoryCard({ name, slug }: { name: string; slug: string }) {
    return (
      <div data-testid="category-card">
        <a href={`/store/category/${slug}`}>{name}</a>
      </div>
    );
  };
});

jest.mock("@/components/store/CampaignBanner", () => () => <div data-testid="campaign-banner" />);
jest.mock("@/components/store/PackageLadderGrid", () => () => <div data-testid="ladders" />);

function mockDb() {
  getApiClient.mockReturnValue({
    store: {
      listProducts: jest.fn().mockResolvedValue([
        {
          id: "db-only",
          slug: "db-only-service",
          name: "DB Only Service",
          categoryId: "db-cat",
          category: "DB Category",
          type: "service",
          display: true,
          status: "active",
          priceRange: "$1",
          summary: "Straight from the database",
          tags: ["quick-win"],
          attributes: {},
        },
      ]),
      listCategories: jest.fn().mockResolvedValue([
        {
          id: "db-cat",
          name: "DB Category",
          slug: "db-category",
          description: "DB category description",
          productIds: [],
          count: 0,
        },
      ]),
    },
  });
}

describe("public storefront reads the DB-backed catalog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb();
  });

  it("renders DB products on the store index instead of the bundled JSON", async () => {
    const StorePage = (await import("@/app/(public)/store/page")).default;

    render(await StorePage());

    expect(screen.getByText("DB Only Service")).toBeInTheDocument();
    expect(screen.queryByText("Quick Fixes")).not.toBeInTheDocument();
  });

  it("renders DB categories in the sidebar data passed to the layout", async () => {
    const StoreLayout = (await import("@/app/(public)/store/layout")).default;

    const { container } = render(await StoreLayout({ children: <div /> }));

    expect(container.textContent).toContain("DB Category");
  });

  it("renders a DB product on the category page", async () => {
    const CategoryPage = (await import("@/app/(public)/store/category/[slug]/page")).default;

    render(await CategoryPage({ params: Promise.resolve({ slug: "db-category" }) }));

    expect(screen.getByText("DB Only Service")).toBeInTheDocument();
  });
});
