import { render, screen } from "@testing-library/react";
import ResourcesPage from "@/app/(public)/resources/page";

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("ResourcesPage", () => {
  it("renders resource titles", () => {
    render(<ResourcesPage />);
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Cyber Insurance Readiness Checklist")).toBeInTheDocument();
    expect(screen.getByText("Small Business IT Starter Checklist")).toBeInTheDocument();
    expect(screen.getByText("Website Health Checklist")).toBeInTheDocument();
  });

  it("links to detail pages", () => {
    render(<ResourcesPage />);
    const link = screen.getByText("Cyber Insurance Readiness Checklist").closest("a");
    expect(link).toHaveAttribute("href", "/resources/cyber_insurance_readiness_checklist");
  });

  it("shows free resource label", () => {
    render(<ResourcesPage />);
    const freeLabels = screen.getAllByText("Free resource");
    expect(freeLabels.length).toBeGreaterThanOrEqual(8);
  });
});
