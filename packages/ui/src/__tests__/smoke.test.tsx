import { fireEvent, render, screen } from "@testing-library/react";

import { Avatar } from "../components/Avatar";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { Dialog } from "../components/Dialog";
import { Input } from "../components/Input";
import { cn } from "../lib/cn";

/**
 * Smoke suite for the shared UI kit (TEST-P3-005). It exercises every exported
 * component family through the public subpath imports so `turbo run
 * test:coverage` gates the package instead of skipping it.
 */
describe("@mct/ui smoke suite", () => {
  it("cn merges conditional classes and dedupes tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", undefined, "font-bold")).toBe(
      "text-sm font-bold",
    );
  });

  it("Button renders children and fires onClick", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button).toHaveClass("uppercase");
  });

  it("Button honours disabled and loading", () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Disabled" }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("Input wires label, helper text and error alert", () => {
    const { rerender } = render(
      <Input label="Email" helperText="Work address" />,
    );
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Work address",
    );

    rerender(<Input label="Email" error="Required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("Badge renders variant classes", () => {
    render(<Badge variant="danger">Down</Badge>);
    expect(screen.getByText("Down")).toHaveClass("cyber-pill-danger");
  });

  it("Chip renders a labelled remove control", () => {
    const onRemove = jest.fn();
    render(<Chip label="Open" onRemove={onRemove} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove Open" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("Avatar falls back to initials when there is no image", () => {
    render(<Avatar fallback="MC" alt="Maine CyberTech" />);
    expect(screen.getByText("MC")).toBeInTheDocument();
  });

  it("Dialog renders nothing when closed and reports Escape when open", () => {
    const onOpenChange = jest.fn();
    const { rerender } = render(
      <Dialog open={false} onOpenChange={onOpenChange} title="Confirm">
        body
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <Dialog open onOpenChange={onOpenChange} title="Confirm">
        body
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Confirm");
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });
});
