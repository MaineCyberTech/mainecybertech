import { act, render, screen } from "@testing-library/react";
import { OfflineIndicator } from "@/components/OfflineIndicator";

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    value,
    configurable: true,
  });
}

describe("OfflineIndicator (USE-P3-002)", () => {
  afterEach(() => {
    setOnline(true);
  });

  it("renders nothing while online", () => {
    setOnline(true);
    render(<OfflineIndicator />);
    expect(screen.queryByText(/you are offline/i)).not.toBeInTheDocument();
  });

  it("shows the offline banner when the browser goes offline", async () => {
    setOnline(true);
    render(<OfflineIndicator />);

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(await screen.findByRole("status")).toHaveTextContent(/you are offline/i);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("hides the banner when the connection returns", async () => {
    setOnline(false);
    render(<OfflineIndicator />);
    expect(await screen.findByRole("status")).toBeInTheDocument();

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
