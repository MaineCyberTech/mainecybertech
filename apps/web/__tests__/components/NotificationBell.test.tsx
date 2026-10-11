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

  constructor(public url: string) {
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
});
