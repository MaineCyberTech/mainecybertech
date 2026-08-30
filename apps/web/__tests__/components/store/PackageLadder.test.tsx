import { render, screen } from "@testing-library/react";
import PackageLadder from "@/components/store/PackageLadder";

describe("PackageLadder", () => {
  it("renders three tier cards (Good, Better, Best)", () => {
    render(<PackageLadder category="Cybersecurity" />);
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Better")).toBeInTheDocument();
    expect(screen.getByText("Best")).toBeInTheDocument();
  });

  it("each card has a product name", () => {
    render(<PackageLadder category="Cybersecurity" />);
    expect(screen.getByText("MFA Setup Session")).toBeInTheDocument();
    expect(screen.getByText("M365 Secure Bundle")).toBeInTheDocument();
    expect(screen.getByText("MCT Secure Care")).toBeInTheDocument();
  });

  it("renders with MCT styling", () => {
    const { container } = render(<PackageLadder category="Cybersecurity" />);
    expect(container.querySelector(".grid")).toBeInTheDocument();
    expect(container.querySelector(".font-orbitron")).toBeInTheDocument();
  });

  it("returns null for unknown category", () => {
    const { container } = render(<PackageLadder category="Unknown" />);
    expect(container.innerHTML).toBe("");
  });
});
