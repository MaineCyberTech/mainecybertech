import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmModal from "@/components/admin/documents/ConfirmModal";

describe("ConfirmModal", () => {
  const onConfirm = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderModal(overrides: Partial<React.ComponentProps<typeof ConfirmModal>> = {}) {
    return render(
      <ConfirmModal
        open
        title="Delete document"
        body="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onClose={onClose}
        {...overrides}
      />,
    );
  }

  it("caps the panel height and scrolls internally for small viewports", () => {
    renderModal();

    const dialog = screen.getByRole("dialog", { name: "Delete document" });
    expect(dialog.className).toContain("max-h-[90vh]");
    expect(dialog.className).toContain("overflow-y-auto");
    expect(dialog.className).toContain("w-[calc(100vw-2rem)]");
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Cancel is clicked", () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the confirm action through the @mct/ui Button primitive", () => {
    renderModal();

    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm.className).toContain("bg-emerald-600");
    expect(confirm.className).not.toContain("cyber-button");
  });

  it("uses the danger button variant for destructive confirmations", () => {
    renderModal({ danger: true });

    expect(screen.getByRole("button", { name: "Delete" }).className).toContain("red");
  });

  it("renders nothing when closed", () => {
    renderModal({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
