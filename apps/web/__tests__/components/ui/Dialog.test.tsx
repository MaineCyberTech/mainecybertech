import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "@mct/ui/components/Dialog";

describe("Dialog", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("always renders the close button, even without a title or description", async () => {
    const onOpenChange = jest.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <p>body content</p>
      </Dialog>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("uses ariaLabel when no title is provided", () => {
    render(
      <Dialog open onOpenChange={() => {}} ariaLabel="Share settings">
        <p>body content</p>
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label", "Share settings");
    expect(dialog).not.toHaveAttribute("aria-labelledby");
  });

  it("prefers aria-labelledby when a title is provided", () => {
    render(
      <Dialog open onOpenChange={() => {}} title="Create Share Link" ariaLabel="Share settings">
        <p>body content</p>
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(dialog).not.toHaveAttribute("aria-label");
    expect(screen.getByRole("heading", { name: "Create Share Link" })).toBeInTheDocument();
  });

  it("makes the dialog node script-focusable", () => {
    render(
      <Dialog open onOpenChange={() => {}} title="Titled">
        <button type="button">Action</button>
      </Dialog>,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("tabindex", "-1");
  });

  it("moves focus into the dialog when opened", () => {
    render(
      <Dialog open onOpenChange={() => {}} title="Titled">
        <button type="button">Action</button>
      </Dialog>,
    );

    expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
  });

  it("focuses the first input instead of the close button when one exists", () => {
    render(
      <Dialog open onOpenChange={() => {}} title="Titled">
        <button type="button">Action</button>
        <input placeholder="Name" />
      </Dialog>,
    );

    expect(screen.getByPlaceholderText("Name")).toHaveFocus();
  });

  it("does not steal focus back to the close button when onOpenChange changes identity", () => {
    const { rerender } = render(
      <Dialog open onOpenChange={() => {}} title="Titled">
        <button type="button">Action</button>
      </Dialog>,
    );
    screen.getByRole("button", { name: "Action" }).focus();

    rerender(
      <Dialog open onOpenChange={() => {}} title="Titled">
        <button type="button">Action</button>
      </Dialog>,
    );

    expect(screen.getByRole("button", { name: "Action" })).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const onOpenChange = jest.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Titled">
        <p>body content</p>
      </Dialog>,
    );

    await userEvent.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("locks body scroll while open and restores the previous value on close", () => {
    document.body.style.overflow = "auto";
    const { rerender } = render(
      <Dialog open onOpenChange={() => {}} title="Titled">
        <p>body content</p>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Dialog open={false} onOpenChange={() => {}} title="Titled">
        <p>body content</p>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe("auto");
  });
});
