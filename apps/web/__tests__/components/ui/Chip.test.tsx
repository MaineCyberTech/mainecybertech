import { render, screen, fireEvent } from "@testing-library/react";
import { Chip } from "@mct/ui";

describe("Chip", () => {
  it("renders the label", () => {
    render(<Chip label='Status: active' onRemove={() => {}} />);
    expect(screen.getByText("Status: active")).toBeInTheDocument();
  });

  it("gives the remove button an accessible name and a 24x24 target", () => {
    render(<Chip label='Status: active' onRemove={() => {}} />);
    const remove = screen.getByRole("button", { name: "Remove Status: active" });
    expect(remove).toHaveClass("h-6", "w-6");
  });

  it("supports an explicit remove label", () => {
    render(<Chip label="Search" onRemove={() => {}} removeLabel="Clear search filter" />);
    expect(screen.getByRole("button", { name: "Clear search filter" })).toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", () => {
    const onRemove = jest.fn();
    render(<Chip label="Org: Acme" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Org: Acme" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("renders no remove button when onRemove is omitted", () => {
    render(<Chip label="Static chip" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
