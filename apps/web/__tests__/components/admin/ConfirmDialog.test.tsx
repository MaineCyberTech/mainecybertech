import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

describe("ConfirmDialog", () => {
  const onConfirm = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
    return render(
      <ConfirmDialog
        open
        title="Delete project"
        body="This action cannot be undone."
        onConfirm={onConfirm}
        onClose={onClose}
        {...overrides}
      />,
    );
  }

  it("renders a labelled dialog whose description points at the body", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Delete project" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-describedby", "confirm-dialog-body");
    expect(document.getElementById("confirm-dialog-body")).toHaveTextContent(
      "This action cannot be undone.",
    );
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    renderDialog({ confirmLabel: "Delete" });

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Cancel is clicked", () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed on the dialog", () => {
    renderDialog();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("applies red danger styling to the confirm button", () => {
    renderDialog({ danger: true, confirmLabel: "Delete" });

    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm.className).toContain("red");
  });

  it("renders nothing when closed", () => {
    renderDialog({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
