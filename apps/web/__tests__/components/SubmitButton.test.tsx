import { render, screen } from "@testing-library/react";
import { useFormStatus } from "react-dom";
import SubmitButton from "@/components/SubmitButton";

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  useFormStatus: jest.fn(() => ({ pending: false })),
}));

const mockedUseFormStatus = jest.mocked(useFormStatus);

function formStatus(pending: boolean) {
  return { pending, data: null, method: null, action: null };
}

describe("SubmitButton", () => {
  beforeEach(() => {
    mockedUseFormStatus.mockReturnValue(formStatus(false));
  });

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

  it("disables the button, marks it busy and shows pendingText while pending", () => {
    mockedUseFormStatus.mockReturnValue(formStatus(true));

    render(
      <form>
        <SubmitButton className="cyber-button" pendingText="Deleting…">
          Delete
        </SubmitButton>
      </form>,
    );

    const button = screen.getByRole("button", { name: "Deleting…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });
});
