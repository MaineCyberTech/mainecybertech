import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, toastClass, useToast, type ToastTone } from "@/components/ui/ToastProvider";

function Harness({ tone = "success", title }: { tone?: ToastTone; title?: string }) {
  const { pushToast } = useToast();
  return (
    <button type="button" onClick={() => pushToast(tone, "The message", title)}>
      Fire toast
    </button>
  );
}

describe("ToastProvider", () => {
  it("renders children inside the provider", () => {
    render(
      <ToastProvider>
        <div>child content</div>
      </ToastProvider>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("throws when useToast is used outside a provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Harness />)).toThrow("useToast must be used within a ToastProvider");
    consoleError.mockRestore();
  });

  it("renders the toast viewport as a polite status region", () => {
    const { container } = render(
      <ToastProvider>
        <div />
      </ToastProvider>,
    );
    const viewport = container.querySelector('[role="status"]');
    expect(viewport).toHaveAttribute("aria-live", "polite");
    expect(viewport?.parentElement).toHaveClass("fixed", "right-4", "top-4", "z-[100]");
  });

  it("renders the assertive alert region for error toasts", async () => {
    render(
      <ToastProvider>
        <Harness tone="error" title="Failed" />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fire toast" }));
    const alertRegion = screen.getByRole("alert");
    expect(alertRegion).toHaveAttribute("aria-live", "assertive");
    expect(within(alertRegion).getByText("Failed")).toBeInTheDocument();
    expect(within(alertRegion).getByText("The message")).toBeInTheDocument();
    expect(within(screen.getByRole("status")).queryByText("The message")).not.toBeInTheDocument();
  });

  it("shows a pushed toast with optional title and message", async () => {
    render(
      <ToastProvider>
        <Harness tone="success" title="Saved" />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fire toast" }));
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("The message")).toBeInTheDocument();
  });

  it("dismisses a toast when the dismiss button is clicked", async () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fire toast" }));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss The message" }));
    expect(screen.queryByText("The message")).not.toBeInTheDocument();
  });

  it("labels the dismiss button with the toast title", async () => {
    render(
      <ToastProvider>
        <Harness tone="success" title="Saved" />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fire toast" }));
    expect(screen.getByRole("button", { name: "Dismiss Saved" })).toBeInTheDocument();
  });

  it("truncates long dismiss labels to roughly sixty characters", async () => {
    const longTitle = "x".repeat(80);
    render(
      <ToastProvider>
        <Harness tone="info" title={longTitle} />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fire toast" }));
    expect(screen.getByRole("button", { name: `Dismiss ${"x".repeat(60)}…` })).toBeInTheDocument();
  });

  it("auto-dismisses a toast after five seconds", async () => {
    jest.useFakeTimers();
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    await act(async () => {
      screen.getByRole("button", { name: "Fire toast" }).click();
    });
    expect(screen.getByText("The message")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.queryByText("The message")).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("keeps error toasts until dismissed", async () => {
    jest.useFakeTimers();
    render(
      <ToastProvider>
        <Harness tone="error" title="Failed" />
      </ToastProvider>,
    );
    await act(async () => {
      screen.getByRole("button", { name: "Fire toast" }).click();
    });
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("The message")).toBeInTheDocument();
    await act(async () => {
      screen.getByRole("button", { name: "Dismiss Failed" }).click();
    });
    expect(screen.queryByText("The message")).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("maps every tone to a distinct visual class", () => {
    expect(toastClass("success")).toContain("emerald");
    expect(toastClass("error")).toContain("red");
    expect(toastClass("warning")).toContain("amber");
    expect(toastClass("info")).toContain("blue");
  });
});
