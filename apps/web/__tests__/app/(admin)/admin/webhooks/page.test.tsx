import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockWebhooksList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    webhooks: { list: mockWebhooksList },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/components/admin/AdminBreadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

describe("AdminWebhooksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
  });

  it("renders page shell with title and description", async () => {
    mockWebhooksList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/webhooks/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Webhook Endpoints" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Manage outbound webhook/)).toBeInTheDocument();
  });

  it("renders empty state when no webhooks", async () => {
    mockWebhooksList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/webhooks/page")).default;
    render(await Page());
    expect(
      screen.getByText("No webhook endpoints configured."),
    ).toBeInTheDocument();
  });

  it("renders webhook cards with name and url", async () => {
    mockWebhooksList.mockResolvedValue([
      {
        id: "wh1",
        name: "Slack Notifier",
        url: "https://hooks.slack.com/test",
        events: [],
        is_active: true,
        last_success_at: null,
        last_error: null,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/webhooks/page")).default;
    render(await Page());
    expect(screen.getByText("Slack Notifier")).toBeInTheDocument();
    expect(
      screen.getByText("https://hooks.slack.com/test"),
    ).toBeInTheDocument();
  });

  it("shows active badge for active webhooks", async () => {
    mockWebhooksList.mockResolvedValue([
      {
        id: "wh1",
        name: "ActiveHook",
        url: "https://example.com",
        events: [{ event: "ticket.created" }],
        is_active: true,
        last_success_at: "2026-01-01T00:00:00Z",
        last_error: null,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/webhooks/page")).default;
    render(await Page());
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("shows disabled badge for inactive webhooks", async () => {
    mockWebhooksList.mockResolvedValue([
      {
        id: "wh1",
        name: "OffHook",
        url: "https://example.com",
        events: [],
        is_active: false,
        last_success_at: null,
        last_error: null,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/webhooks/page")).default;
    render(await Page());
    expect(screen.getAllByText("Disabled").length).toBeGreaterThanOrEqual(1);
  });

  it("links each webhook to its detail page", async () => {
    mockWebhooksList.mockResolvedValue([
      {
        id: "wh-1",
        name: "Test",
        url: "https://example.com",
        events: [],
        is_active: true,
        last_success_at: null,
        last_error: null,
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/webhooks/page")).default;
    render(await Page());
    const links = screen.getAllByRole("link");
    expect(
      links.some((l) => l.getAttribute("href") === "/admin/webhooks/wh-1"),
    ).toBe(true);
  });

  it("has new webhook button", async () => {
    mockWebhooksList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/webhooks/page")).default;
    render(await Page());
    const newLink = screen.getByText("+ New Webhook");
    expect(newLink.closest("a")).toHaveAttribute("href", "/admin/webhooks/new");
  });
});
