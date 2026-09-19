import { render, screen } from "@testing-library/react";
import PromoBadge from "@/components/store/PromoBadge";

describe("PromoBadge", () => {
  it("renders text", () => {
    render(<PromoBadge text="Bundle Savings Available" />);
    expect(screen.getByText("Bundle Savings Available")).toBeInTheDocument();
  });

  it("has accessible role", () => {
    render(<PromoBadge text="Seasonal Offer" />);
    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
  });

  it("renders with different types without error", () => {
    const { rerender } = render(<PromoBadge text="Bundle" type="bundle_savings" />);
    expect(screen.getByText("Bundle")).toBeInTheDocument();

    rerender(<PromoBadge text="Seasonal" type="seasonal_offer" />);
    expect(screen.getByText("Seasonal")).toBeInTheDocument();

    rerender(<PromoBadge text="Starter Credit" type="starter_credit" />);
    expect(screen.getByText("Starter Credit")).toBeInTheDocument();
  });
});
