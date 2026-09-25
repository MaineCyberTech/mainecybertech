import { render, screen } from "@testing-library/react";
import SubmitButton from "@/components/SubmitButton";

describe("SubmitButton", () => {
  it("renders a submit button with its label", () => {
    render(
      <form>
        <SubmitButton className="cyber-button">Save</SubmitButton>
      </form>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).not.toBeDisabled();
  });

  it("forwards name/value and aria-label", () => {
    render(
      <form>
        <SubmitButton name="intent" value="delete" aria-label="Delete item">
          Delete
        </SubmitButton>
      </form>,
    );
    const button = screen.getByRole("button", { name: "Delete item" });
    expect(button).toHaveAttribute("name", "intent");
    expect(button).toHaveAttribute("value", "delete");
  });
});
