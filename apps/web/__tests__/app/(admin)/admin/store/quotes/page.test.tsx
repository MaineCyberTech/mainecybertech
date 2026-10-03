import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockListQuotes = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    store: { listQuotes: mockListQuotes },
  }),
}));

jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mocks.requireAdminAccess(...args),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/components/Breadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

function mockQuote(overrides: Record<string, unknown> = {}) {
  return {
    id: "quote-1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "207-555-0100",
    notes: "Please call",
    items: [{ productId: "p1", name: "Managed Firewall" }],
    status: "new",
    created_at: "2026-09-01T10:00:00.000Z",
    updated_at: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("AdminStoreQuotesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockListQuotes.mockResolvedValue([]);
  });

  it("renders the page shell and calls the admin gate", async () => {
    const Page = (await import("@/app/(admin)/admin/store/quotes/page")).default;
    render(await Page());

    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("heading", { name: "Quote Requests" })).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("store-quotes");
  });

  it("renders quote rows with human status labels", async () => {
    mockListQuotes.mockResolvedValue([
      mockQuote(),
      mockQuote({ id: "quote-2", name: "Grace Hopper", status: "converted" }),
      mockQuote({ id: "quote-3", name: "Alan Turing", status: "closed" }),
    ]);
    const Page = (await import("@/app/(admin)/admin/store/quotes/page")).default;
    render(await Page());

    expect(screen.getAllByText("Ada Lovelace").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Grace Hopper").length).toBeGreaterThan(0);
    expect(screen.getAllByText("New").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Converted").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Closed").length).toBeGreaterThan(0);
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    expect(screen.queryByText("Submitted")).not.toBeInTheDocument();
  });

  it("maps statuses to the expected shared tones", async () => {
    mockListQuotes.mockResolvedValue([
      mockQuote({ id: "q-new", status: "new" }),
      mockQuote({ id: "q-reviewed", status: "reviewed" }),
      mockQuote({ id: "q-contacted", status: "contacted" }),
      mockQuote({ id: "q-converted", status: "converted" }),
      mockQuote({ id: "q-closed", status: "closed" }),
    ]);
    const Page = (await import("@/app/(admin)/admin/store/quotes/page")).default;
    render(await Page());

    expect(screen.getAllByText("New")[0].className).toContain("-blue-");
    expect(screen.getAllByText("Reviewed")[0].className).toContain("-amber-");
    expect(screen.getAllByText("Contacted")[0].className).toMatch(/-sky-|-blue-/);
    expect(screen.getAllByText("Converted")[0].className).toContain("-emerald-");
    expect(screen.getAllByText("Closed")[0].className).toContain("-slate-");
  });

  it("shows the empty state when there are no quotes", async () => {
    const Page = (await import("@/app/(admin)/admin/store/quotes/page")).default;
    render(await Page());

    expect(screen.getByText("No quote requests yet.")).toBeInTheDocument();
  });

  it("surfaces a load failure instead of a misleading empty state", async () => {
    mockListQuotes.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/store/quotes/page")).default;
    render(await Page());

    expect(screen.getByText(/could not load store quotes/i)).toBeInTheDocument();
    expect(screen.queryByText("No quote requests yet.")).not.toBeInTheDocument();
  });
});
