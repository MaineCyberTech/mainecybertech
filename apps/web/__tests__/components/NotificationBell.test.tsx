import { jest } from "@jest/globals";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

const mockUnreadCount = jest.fn();
const mockList = jest.fn();
const mockListPreferences = jest.fn();
const mockUpdatePreferences = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    notifications: {
      unreadCount: mockUnreadCount,
      list: mockList,
      listPreferences: mockListPreferences,
      updatePreferences: mockUpdatePreferences,
      markAllRead: jest.fn(),
      markRead: jest.fn(),
    },
  }),
}));

jest.mock("@/lib/env", () => ({
  getClientEnv: jest.fn().mockReturnValue({ NEXT_PUBLIC_API_URL: "http://api.test" }),
}));

class MockEventSource {
  static instances: MockEventSource[] = [];

  static reset() {
    MockEventSource.instances = [];
  }

  onerror: (() => void) | null = null;
  closed = false;
  private listeners = new Map<string, ((event: MessageEvent) => void)[]>();

  constructor(public url: string, _options?: EventSourceInit) {
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, cb: (event: MessageEvent) => void) {
    const list = this.listeners.get(type) ?? [];
    list.push(cb);
    this.listeners.set(type, list);
  }

  close() {
    this.closed = true;
  }
}

(globalThis as unknown as { EventSource: unknown }).EventSource = MockEventSource;

import NotificationBell from "@/components/NotificationBell";

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("NotificationBell SSE fallback polling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    MockEventSource.reset();
    mockUnreadCount.mockResolvedValue({ count: 0 });
    mockList.mockResolvedValue({ items: [], total: 0 });
    mockListPreferences.mockResolvedValue({ preferences: [] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts one fallback poller on SSE failure and clears it on unmount", async () => {
    const { unmount } = render(<NotificationBell basePath="/portal" />);
    await flushMicrotasks();

    expect(MockEventSource.instances).toHaveLength(1);
    const es = MockEventSource.instances[0];

    // onerror can fire repeatedly; only one interval may be created.
    act(() => {
      es.onerror?.();
      es.onerror?.();
    });

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(30000);
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(3);

    unmount();
    expect(es.closed).toBe(true);

    // The interval must not keep polling after unmount (USE-P2-006).
    await act(async () => {
      jest.advanceTimersByTime(120000);
    });
    expect(mockUnreadCount).toHaveBeenCalledTimes(3);
  });

  it("shows an error instead of a false empty state when the recent list fails", async () => {
    jest.useRealTimers();
    mockList.mockRejectedValueOnce(new Error("list unavailable"));

    const { unmount } = render(<NotificationBell basePath="/portal" initialUnread={1} />);
    await flushMicrotasks();

    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    expect(await screen.findByText("Unable to load notifications")).toBeInTheDocument();
    expect(screen.queryByText("No new notifications")).not.toBeInTheDocument();

    unmount();
  });

  it("exposes aria-expanded on the toggle and closes on Escape with focus return", async () => {
    jest.useRealTimers();
    const { unmount } = render(<NotificationBell basePath="/portal" />);
    await flushMicrotasks();

    const toggle = screen.getByRole("button", { name: /notifications/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(toggle);

    unmount();
  });
});

describe("NotificationBell mobile panel and hit areas (MOB-P3-002, MOB-P3-003)", () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    MockEventSource.reset();
    mockUnreadCount.mockResolvedValue({ count: 1 });
    mockList.mockResolvedValue({
      items: [
        {
          id: "n1",
          title: "Ticket updated",
          body: "Your ticket moved to in progress",
          module: "tickets",
          created_at: "2026-10-01T12:00:00.000Z",
        },
      ],
      total: 1,
    });
    mockListPreferences.mockResolvedValue({ preferences: [] });
  });

  it("anchors the panel to the viewport on phones and enlarges the icon-button hit areas", async () => {
    const { unmount } = render(<NotificationBell basePath="/portal" initialUnread={1} />);
    await flushMicrotasks();

    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    const panel = await screen.findByTestId("notification-panel");
    // Viewport-relative width on phones; bell-anchored dropdown from `sm` up.
    expect(panel.className).toContain("w-[min(20rem,calc(100vw_-_2rem))]");
    expect(panel.className).toContain("fixed");
    expect(panel.className).toContain("sm:absolute");
    expect(panel.className).toContain("sm:w-80");

    // 44px hit areas: icon/text box + padding - negative margin = 44px border box.
    const markAllRead = await screen.findByRole("button", { name: /mark all read/i });
    expect(markAllRead.className).toContain("p-3.5");
    expect(markAllRead.className).toContain("-m-3.5");
    const dismiss = screen.getByRole("button", { name: /dismiss notification/i });
    expect(dismiss.className).toContain("p-4");
    expect(dismiss.className).toContain("-m-3");

    unmount();
  });
});
