import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/components/ui/ToastProvider";

let mocks: {
  requireAdminAccess: jest.Mock;
  requirePermission: jest.Mock;
};

const mockListDeadLetters = jest.fn();
const mockRetryDeadLetterAction = jest.fn();
const mockDismissDeadLetterAction = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({ webhooks: { listDeadLetters: mockListDeadLetters } }),
}));

jest.mock("@/app/(admin)/admin/webhooks/dead-letters/actions", () => ({
  retryDeadLetterAction: (...args: unknown[]) => mockRetryDeadLetterAction(...args),
  dismissDeadLetterAction: (...args: unknown[]) => mockDismissDeadLetterAction(...args),
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: unknown[]) => mocks.requireAdminAccess(...args),
}));

jest.mock("@/lib/auth/permissions", () => ({
  requirePermission: (...args: unknown[]) => mocks.requirePermission(...args),
}));

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: { current: string }) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

const deadLetter = {
  id: "dl1",
  webhook_id: "wh1",
  event: "ticket.created",
  attempt_count: 5,
  last_attempt_at: "2026-09-01T10:00:00.000Z",
  last_error: "HTTP 500 after 5 attempts",
  created_at: "2026-09-01T09:00:00.000Z",
  endpoint: { id: "wh1", name: "Ops Hook", url: "https://example.com/hook" },
};

describe("AdminWebhookDeadLettersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = {
      requireAdminAccess: jest.fn().mockResolvedValue(undefined),
      requirePermission: jest.fn().mockResolvedValue(undefined),
    };
    mockListDeadLetters.mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 });
    mockRetryDeadLetterAction.mockResolvedValue({ ok: true });
    mockDismissDeadLetterAction.mockResolvedValue({ ok: true });
  });

  it("renders the page shell and calls the admin gate", async () => {
    const Page = (await import("@/app/(admin)/admin/webhooks/dead-letters/page")).default;
    render(<ToastProvider>{await Page()}</ToastProvider>);

    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Dead-Letter Deliveries" })).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("webhooks");
  });

  it("renders dead-letter rows with endpoint, attempts and truncated error", async () => {
    mockListDeadLetters.mockResolvedValue({
      items: [deadLetter],
      total: 1,
      page: 1,
      limit: 50,
    });
    const Page = (await import("@/app/(admin)/admin/webhooks/dead-letters/page")).default;
    render(<ToastProvider>{await Page()}</ToastProvider>);

    expect(screen.getByText("ticket.created")).toBeInTheDocument();
    expect(screen.getByText("Ops Hook")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/hook")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    const error = screen.getByText("HTTP 500 after 5 attempts");
    expect(error).toHaveAttribute("title", "HTTP 500 after 5 attempts");
    expect(screen.getByRole("button", { name: "Retry ticket.created" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss ticket.created" })).toBeInTheDocument();
  });

  it("names the event in the dismiss confirmation", async () => {
    mockListDeadLetters.mockResolvedValue({
      items: [deadLetter],
      total: 1,
      page: 1,
      limit: 50,
    });
    const Page = (await import("@/app/(admin)/admin/webhooks/dead-letters/page")).default;
    render(<ToastProvider>{await Page()}</ToastProvider>);

    fireEvent.click(screen.getByRole("button", { name: "Dismiss ticket.created" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Dismiss the "ticket.created" delivery\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/dead-letter entry for "ticket.created" will be permanently removed/i),
    ).toBeInTheDocument();
  });

  it("clears the busy state when a row action rejects", async () => {
    mockListDeadLetters.mockResolvedValue({
      items: [deadLetter],
      total: 1,
      page: 1,
      limit: 50,
    });
    mockRetryDeadLetterAction.mockRejectedValue(new Error("network down"));
    const Page = (await import("@/app/(admin)/admin/webhooks/dead-letters/page")).default;
    render(<ToastProvider>{await Page()}</ToastProvider>);

    fireEvent.click(screen.getByRole("button", { name: "Retry ticket.created" }));

    expect(
      await screen.findByText(/Failed to retry the "ticket.created" delivery/i),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Retry ticket.created" })).toBeEnabled(),
    );
  });

  it("logs a load failure instead of swallowing it", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockListDeadLetters.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/webhooks/dead-letters/page")).default;
    render(<ToastProvider>{await Page()}</ToastProvider>);

    expect(consoleError).toHaveBeenCalledWith("[[dead-letters]/page]", expect.any(Error));
    consoleError.mockRestore();
  });

  it("shows the empty state when there are no dead letters", async () => {
    const Page = (await import("@/app/(admin)/admin/webhooks/dead-letters/page")).default;
    render(<ToastProvider>{await Page()}</ToastProvider>);

    expect(screen.getByText("No dead-letter deliveries.")).toBeInTheDocument();
  });

  it("surfaces a load failure instead of a misleading empty state", async () => {
    mockListDeadLetters.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/webhooks/dead-letters/page")).default;
    render(<ToastProvider>{await Page()}</ToastProvider>);

    expect(screen.getByText(/could not load dead-letter deliveries/i)).toBeInTheDocument();
    expect(screen.queryByText("No dead-letter deliveries.")).not.toBeInTheDocument();
  });
});
