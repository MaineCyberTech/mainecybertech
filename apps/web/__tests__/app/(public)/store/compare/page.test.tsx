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
    expect(screen.getByText("Compare Services")).toBeInTheDocument();
    expect(screen.getByText("Quick Fix vs Bundle")).toBeInTheDocument();
    expect(screen.getByText("Essential Care vs Business Care")).toBeInTheDocument();
    expect(screen.getByText("Website Health Check vs Website Care")).toBeInTheDocument();
  });

  it("links to comparison detail pages", () => {
    render(<ComparePage />);
    const quickFixLink = screen.getByText("Quick Fix vs Bundle").closest("a");
    expect(quickFixLink).toHaveAttribute("href", "/store/compare/quick-fix-vs-bundle");

    const essentialCareLink = screen.getByText("Essential Care vs Business Care").closest("a");
    expect(essentialCareLink).toHaveAttribute(
      "href",
      "/store/compare/essential-care-vs-business-care",
    );
  });

  it("shows item count per comparison", () => {
    render(<ComparePage />);
    const countTexts = screen.getAllByText(/items compared/);
    expect(countTexts.length).toBeGreaterThanOrEqual(3);
  });
});
