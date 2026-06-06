import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ConfirmDangerButton", () => {
  let ConfirmDangerButton: typeof import("@/components/admin/ConfirmDangerButton").default;

  beforeAll(async () => {
    ConfirmDangerButton = (await import("@/components/admin/ConfirmDangerButton")).default;
  });

  beforeEach(() => {
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders with default label and trash icon", () => {
    render(<ConfirmDangerButton />);
    expect(screen.getByRole("button")).toHaveAttribute("title", "Delete");
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("renders icon-only mode without label text", () => {
    render(<ConfirmDangerButton iconOnly />);
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Delete");
  });

  it("renders custom label and title", () => {
    render(<ConfirmDangerButton label="Remove" title="Remove item" />);
    expect(screen.getByRole("button")).toHaveAttribute("title", "Remove item");
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("allows default submit when confirm returns true", async () => {
    const user = userEvent.setup();
    (window.confirm as jest.Mock).mockReturnValue(true);

    render(<ConfirmDangerButton />);
    const button = screen.getByRole("button");
    await user.click(button);

    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure? This action cannot be undone.",
    );
  });

  it("prevents default submit when confirm returns false", async () => {
    const user = userEvent.setup();
    (window.confirm as jest.Mock).mockReturnValue(false);

    render(<ConfirmDangerButton />);
    const button = screen.getByRole("button");
    await user.click(button);

    expect(window.confirm).toHaveBeenCalled();
  });

  it("renders custom icon", () => {
    render(<ConfirmDangerButton icon={<span data-testid="custom-icon">X</span>} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ConfirmDangerButton className="custom-class" />);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("renders custom confirm message", async () => {
    const user = userEvent.setup();
    (window.confirm as jest.Mock).mockReturnValue(false);

    render(<ConfirmDangerButton confirmMessage="Custom confirm?" />);
    await user.click(screen.getByRole("button"));

    expect(window.confirm).toHaveBeenCalledWith("Custom confirm?");
  });
});
