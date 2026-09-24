import { useRef } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useFocusTrap } from "@/lib/use-focus-trap";

function Trap({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div ref={ref}>
      <button>First</button>
      <button>Last</button>
    </div>
  );
}

describe("useFocusTrap", () => {
  it("moves focus to the first focusable element when activated", () => {
    render(<Trap active />);
    expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
  });

  it("does not move focus when inactive", () => {
    render(<Trap active={false} />);
    expect(screen.getByRole("button", { name: "First" })).not.toHaveFocus();
  });

  it("wraps Tab from the last element back to the first", () => {
    render(<Trap active />);
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(first).toHaveFocus();
  });

  it("wraps Shift+Tab from the first element to the last", () => {
    render(<Trap active />);
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });
    first.focus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("restores focus to the previously focused element on unmount", () => {
    const outside = document.createElement("button");
    outside.textContent = "Outside";
    document.body.appendChild(outside);
    outside.focus();

    const { unmount } = render(<Trap active />);
    expect(outside).not.toHaveFocus();

    unmount();
    expect(outside).toHaveFocus();

    cleanup();
    outside.remove();
  });
});
