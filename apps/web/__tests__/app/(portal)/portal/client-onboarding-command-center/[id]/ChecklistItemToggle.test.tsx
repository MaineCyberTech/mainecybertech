import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockToggle = jest.fn();
jest.mock("@/app/(portal)/portal/client-onboarding-command-center/[id]/actions", () => ({
  toggleChecklistItemAction: (...args: unknown[]) => mockToggle(...args),
}));

import ChecklistItemToggle from "@/app/(portal)/portal/client-onboarding-command-center/[id]/ChecklistItemToggle";

const baseProps = {
  recordId: "rec-1",
  itemId: "item-1",
  label: "Collect M365 admin credentials",
  isRequired: true,
  notes: null,
  completedAt: null,
  initialCompleted: false,
};

describe("ChecklistItemToggle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders an enabled checkbox (USE-P2-008)", () => {
    render(<ChecklistItemToggle {...baseProps} />);

    const checkbox = screen.getByRole("checkbox", { name: baseProps.label });
    expect(checkbox).toBeEnabled();
    expect(checkbox).not.toBeChecked();
  });

  it("completes the item through the server action", async () => {
    mockToggle.mockResolvedValue({ ok: true });
    render(<ChecklistItemToggle {...baseProps} />);

    await userEvent.click(screen.getByRole("checkbox", { name: baseProps.label }));

    await waitFor(() =>
      expect(mockToggle).toHaveBeenCalledWith("rec-1", "item-1", true),
    );
    expect(screen.getByRole("checkbox", { name: baseProps.label })).toBeChecked();
  });

  it("reverts the checkbox and shows the error when the write fails", async () => {
    mockToggle.mockResolvedValue({ ok: false, error: "Forbidden" });
    render(<ChecklistItemToggle {...baseProps} />);

    await userEvent.click(screen.getByRole("checkbox", { name: baseProps.label }));

    await waitFor(() => expect(screen.getByText("Forbidden")).toBeInTheDocument());
    expect(screen.getByRole("checkbox", { name: baseProps.label })).not.toBeChecked();
  });
});
