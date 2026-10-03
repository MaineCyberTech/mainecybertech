import { render, screen } from "@testing-library/react";
import StoreProductCard from "@/components/store/StoreProductCard";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const PROPS = {
  slug: "password-security-checkup",
  name: "Password Security Checkup",
  summary: "Review password habits, shared account risks, and password manager readiness.",
  priceRange: "$49-$99",
  categoryName: "Quick Fixes",
  categorySlug: "quick-fixes",
};

describe("StoreProductCard", () => {
  it("renders product name", () => {
    render(<StoreProductCard {...PROPS} />);
    expect(screen.getByText(PROPS.name)).toBeInTheDocument();
  });

  it("renders summary", () => {
    render(<StoreProductCard {...PROPS} />);
    expect(screen.getByText(PROPS.summary)).toBeInTheDocument();
  });

  it("renders price range", () => {
    render(<StoreProductCard {...PROPS} />);
    expect(screen.getByText(PROPS.priceRange)).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<StoreProductCard {...PROPS} />);
    expect(screen.getByText(PROPS.categoryName)).toBeInTheDocument();
  });

  it("links to correct slug path", () => {
    render(<StoreProductCard {...PROPS} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/store/${PROPS.slug}`);
  });

  it('has accessible "View Details" text', () => {
    render(<StoreProductCard {...PROPS} />);
    expect(screen.getByText("View Details →")).toBeInTheDocument();
  });
});
