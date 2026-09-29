import { jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = jest.mocked(usePathname);

describe("RouteAnnouncer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.title = "Fallback Title";
    mockUsePathname.mockReturnValue("/admin");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not announce the initial load", async () => {
    const { RouteAnnouncer } = await import("@/components/RouteAnnouncer");
    render(
      <>
        <h1>Dashboard</h1>
        <RouteAnnouncer />
      </>,
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("announces the new heading after a pathname change", async () => {
    const { RouteAnnouncer } = await import("@/components/RouteAnnouncer");
    const { rerender } = render(
      <>
        <h1>Dashboard</h1>
        <RouteAnnouncer />
      </>,
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });

    mockUsePathname.mockReturnValue("/admin/tickets");
    rerender(
      <>
        <h1>Tickets</h1>
        <RouteAnnouncer />
      </>,
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Tickets");
  });

  it("falls back to the document title when no heading exists after navigation", async () => {
    const { RouteAnnouncer } = await import("@/components/RouteAnnouncer");
    const { rerender } = render(<RouteAnnouncer />);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    mockUsePathname.mockReturnValue("/admin/other");
    rerender(<RouteAnnouncer />);

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Fallback Title");
  });
});
