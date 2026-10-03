import { render, screen } from "@testing-library/react";
import StoreCategoryCard from "@/components/store/StoreCategoryCard";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const PROPS = {
  name: "Quick Fixes",
  slug: "quick-fixes",
  description:
    "Low-friction, high-value services that solve a focused problem or create a clear improvement path.",
  count: 12,
};

describe("StoreCategoryCard", () => {
  it("renders category name", () => {
    render(<StoreCategoryCard {...PROPS} />);
    expect(screen.getByText(PROPS.name)).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<StoreCategoryCard {...PROPS} />);
    expect(screen.getByText(PROPS.description)).toBeInTheDocument();
  });

  it("shows product count", () => {
    render(<StoreCategoryCard {...PROPS} />);
    expect(screen.getByText(String(PROPS.count))).toBeInTheDocument();
  });

  it("links to correct category filter", () => {
    render(<StoreCategoryCard {...PROPS} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/store/category/${PROPS.slug}`);
  });

  it('has accessible "Browse" text', () => {
    render(<StoreCategoryCard {...PROPS} />);
    expect(screen.getByText(`Browse ${PROPS.name} →`)).toBeInTheDocument();
  });
});
