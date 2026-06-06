import { jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";

describe("ConfirmIntentButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders default label", async () => {
    const { default: ConfirmIntentButton } = await import(
      "@/components/admin/ConfirmIntentButton"
    );
    render(<ConfirmIntentButton />);

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("renders custom label", async () => {
    const { default: ConfirmIntentButton } = await import(
      "@/components/admin/ConfirmIntentButton"
    );
    render(<ConfirmIntentButton label="Remove" />);

    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("renders icon-only mode", async () => {
    const { default: ConfirmIntentButton } = await import(
      "@/components/admin/ConfirmIntentButton"
    );
    render(<ConfirmIntentButton iconOnly={true} title="Delete item" />);

    const button = screen.getByRole("button", { name: "Delete item" });
    expect(button).toBeInTheDocument();
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("prevents default when confirm is cancelled", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false);

    const { default: ConfirmIntentButton } = await import(
      "@/components/admin/ConfirmIntentButton"
    );
    render(<ConfirmIntentButton />);

    const button = screen.getByRole("button");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");

    button.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("does not prevent default when confirm is accepted", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true);

    const { default: ConfirmIntentButton } = await import(
      "@/components/admin/ConfirmIntentButton"
    );
    render(<ConfirmIntentButton />);

    const button = screen.getByRole("button");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    const preventDefaultSpy = jest.spyOn(event, "preventDefault");

    button.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});
