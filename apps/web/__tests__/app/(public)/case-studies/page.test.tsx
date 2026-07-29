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
    expect(screen.getByText("Case Studies")).toBeInTheDocument();
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No case studies available at this time.")).toBeInTheDocument();
  });
});
