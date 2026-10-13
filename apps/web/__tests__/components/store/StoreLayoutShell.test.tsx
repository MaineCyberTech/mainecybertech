import { render, screen, fireEvent } from "@testing-library/react";
import StoreLayoutShell from "@/components/store/StoreLayoutShell";

jest.mock("@/components/store/StoreSidebar", () => {
  return function MockStoreSidebar() {
    return <nav aria-label="Service categories" />;
  };
});

jest.mock("@/lib/use-focus-trap", () => ({
  useFocusTrap: () => {},
}));

describe("StoreLayoutShell drawer toggle", () => {
  it("exposes aria-expanded and flips it when the drawer opens", () => {
    render(
      <StoreLayoutShell categories={[]}>
        <p>Store body</p>
      </StoreLayoutShell>,
    );

    const toggle = screen.getByLabelText("Browse categories");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Store menu" })).toBeInTheDocument();
  });
});
