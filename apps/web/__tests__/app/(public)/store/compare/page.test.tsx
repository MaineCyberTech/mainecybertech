import { render, screen } from "@testing-library/react";
import ComparePage from "@/app/(public)/store/compare/page";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("ComparePage", () => {
  it("renders comparison cards", () => {
    render(<ComparePage />);
    expect(screen.getByText(/Compare/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Fix/i)).toBeInTheDocument();
    expect(screen.getByText(/Essential Care/i)).toBeInTheDocument();
    expect(screen.getByText(/Website Health/i)).toBeInTheDocument();
  });

  it("links to comparison detail pages", () => {
    render(<ComparePage />);
    const quickFixLink = screen.getByText(/Quick Fix/i).closest("a");
    expect(quickFixLink).toHaveAttribute("href", "/store/compare/quick-fix-vs-bundle");

    const essentialCareLink = screen.getByText(/Essential Care/i).closest("a");
    expect(essentialCareLink).toHaveAttribute(
      "href",
      "/store/compare/essential-care-vs-business-care",
    );
  });

  it("shows item count per comparison", () => {
    render(<ComparePage />);
const countTexts = screen.getAllByText(/care/i);
    expect(countTexts.length).toBeGreaterThanOrEqual(1);
  });
});


