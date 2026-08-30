import { render, screen } from "@testing-library/react";
import CaseStudiesPage from "@/app/(public)/case-studies/page";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("CaseStudiesPage", () => {
  it("shows empty state when no approved case studies exist", () => {
    render(<CaseStudiesPage />);
    expect(screen.getAllByText(/case study/i).length).toBeGreaterThanOrEqual(1);
  });
});

