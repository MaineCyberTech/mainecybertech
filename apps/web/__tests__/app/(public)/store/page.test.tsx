import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

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

jest.mock("@/components/store/CampaignBanner", () => {
  return function MockCampaignBanner() {
    return <div data-testid="campaign-banner">Seasonal campaigns</div>;
  };
});

jest.mock("@/components/store/PackageLadderGrid", () => {
  return function MockPackageLadderGrid() {
    return <div data-testid="package-ladders">Package ladders</div>;
  };
});

describe("StorePage (public store index)", () => {
  it("renders hero heading with CTA", async () => {
    const Page = (await import("@/app/(public)/store/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: /browse our services/i })).toBeInTheDocument();
    expect(screen.getByText(/every service includes clear scope/i)).toBeInTheDocument();
  });

  it("renders category cards for all public categories", async () => {
    const Page = (await import("@/app/(public)/store/page")).default;
    render(await Page());
    const cards = screen.getAllByTestId("category-card");
    expect(cards.length).toBeGreaterThanOrEqual(10);
    expect(screen.getByText("Quick Fixes")).toBeInTheDocument();
    expect(screen.getByText("Cybersecurity")).toBeInTheDocument();
  });

  it("category cards link to category pages", async () => {
    const Page = (await import("@/app/(public)/store/page")).default;
    render(await Page());
    const link = screen.getByText("Quick Fixes").closest("a");
    expect(link).toHaveAttribute("href", "/store/category/quick-fixes");
  });

  it("renders Quick Wins section with product cards", async () => {
    const Page = (await import("@/app/(public)/store/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: /quick wins/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("product-card").length).toBeGreaterThan(0);
  });

  it("renders Monthly Plans section", async () => {
    const Page = (await import("@/app/(public)/store/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: /monthly it plans/i })).toBeInTheDocument();
  });

  it("renders Emergency Support section", async () => {
    const Page = (await import("@/app/(public)/store/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: /emergency support/i })).toBeInTheDocument();
  });

  it("renders campaign banner and package ladders", async () => {
    const Page = (await import("@/app/(public)/store/page")).default;
    render(await Page());
    expect(screen.getByTestId("campaign-banner")).toBeInTheDocument();
    expect(screen.getByTestId("package-ladders")).toBeInTheDocument();
  });

  it("links to quiz, compare, and quote builder pages", async () => {
    const Page = (await import("@/app/(public)/store/page")).default;
    render(await Page());
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/store/quiz")).toBe(true);
    expect(links.some((l) => l.getAttribute("href") === "/store/compare")).toBe(true);
    expect(links.some((l) => l.getAttribute("href") === "/store/quote")).toBe(true);
  });

  it("links to contact for talking to a human", async () => {
    const Page = (await import("@/app/(public)/store/page")).default;
    render(await Page());
    expect(screen.getByText("Talk to a Human").closest("a")).toHaveAttribute("href", "/contact");
  });
});
