import { jest } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockList = jest.fn();

jest.mock("@/lib/client-api", () => ({
  getClientApi: jest.fn().mockReturnValue({
    notifications: {
      list: mockList,
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    },
  }),
}));

import NotificationsPageClient from "@/components/NotificationsPageClient";

describe("NotificationsPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows an error with retry instead of an empty state when the load fails", async () => {
    mockList.mockRejectedValueOnce(new Error("Notification service unavailable"));

    render(<NotificationsPageClient basePath="/portal" />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Notification service unavailable");
    // A failed load must never render the false "no notifications" empty state.
    expect(screen.queryByText("No notifications found.")).not.toBeInTheDocument();
  });

  it("retries the load and renders the empty state only after success", async () => {
    mockList.mockRejectedValueOnce(new Error("Network error"));

    render(<NotificationsPageClient basePath="/portal" />);
    await screen.findByRole("alert");

    mockList.mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 20 });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("No notifications found.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("links portal ticket notifications to the support route", async () => {
    mockList.mockResolvedValueOnce({
      items: [
        {
          id: "n-1",
          title: "New ticket reply",
          body: "You have a reply",
          module: "tickets",
          module_id: "t-1",
          action: "created",
          read: false,
          created_at: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    });

    render(<NotificationsPageClient basePath="/portal" />);

    const link = await screen.findByRole("link", { name: /new ticket reply/i });
    expect(link).toHaveAttribute("href", "/portal/support/t-1");
  });

  it("does not wait for the initial load to finish before showing the loading state", async () => {
    let resolveList: (value: unknown) => void = () => {};
    mockList.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveList = resolve;
      }),
    );

    render(<NotificationsPageClient basePath="/admin" />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    resolveList({ items: [], total: 0, page: 1, limit: 20 });
    await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
  });
});
