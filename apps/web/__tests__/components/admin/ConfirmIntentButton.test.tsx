import { jest } from "@jest/globals";
import { render, screen, fireEvent, within } from "@testing-library/react";

describe("ConfirmIntentButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders default label", async () => {
    const { default: ConfirmIntentButton } = await import("@/components/admin/ConfirmIntentButton");
    render(<ConfirmIntentButton />);

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("renders custom label", async () => {
    const { default: ConfirmIntentButton } = await import("@/components/admin/ConfirmIntentButton");
    render(<ConfirmIntentButton label="Remove" />);

    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("renders icon-only mode", async () => {
    const { default: ConfirmIntentButton } = await import("@/components/admin/ConfirmIntentButton");
    render(<ConfirmIntentButton iconOnly={true} title="Delete item" />);

    const button = screen.getByRole("button", { name: "Delete item" });
    expect(button).toBeInTheDocument();
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("opens an accessible confirm dialog instead of window.confirm", async () => {
    const { default: ConfirmIntentButton } = await import("@/components/admin/ConfirmIntentButton");
    render(<ConfirmIntentButton />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it("submits the form when the dialog is confirmed", async () => {
    const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault());

    const { default: ConfirmIntentButton } = await import("@/components/admin/ConfirmIntentButton");
    render(
      <form onSubmit={onSubmit}>
        <ConfirmIntentButton />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));

    expect(onSubmit).toHaveBeenCalled();
  });

  it("does not submit when the dialog is cancelled", async () => {
    const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault());

    const { default: ConfirmIntentButton } = await import("@/components/admin/ConfirmIntentButton");
    render(
      <form onSubmit={onSubmit}>
        <ConfirmIntentButton />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
