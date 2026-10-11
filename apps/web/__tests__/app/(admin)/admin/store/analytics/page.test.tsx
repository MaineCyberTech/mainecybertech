import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockSummary = jest.fn();
const mockList = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: () => ({ analytics: { summary: mockSummary, list: mockList } }),
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

describe("AdminStoreAnalyticsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockSummary.mockResolvedValue([]);
    mockList.mockResolvedValue([]);
  });

  it("renders page shell with title and event count", async () => {
    const Page = (await import("@/app/(admin)/admin/store/analytics/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Store Analytics" })).toBeInTheDocument();
    expect(screen.getByText(/\d+ tracked event types/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders live summary rows from the API", async () => {
    mockSummary.mockResolvedValue([
      { event: "product_detail_view", count: 12 },
      { event: "quote_submit", count: 2 },
    ]);
    const Page = (await import("@/app/(admin)/admin/store/analytics/page")).default;
    render(await Page());

    expect(mockSummary).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Live Summary (2)")).toBeInTheDocument();
    // Event names also appear in the static registry chips.
    expect(screen.getAllByText("product_detail_view").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getAllByText("quote_submit").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders recent events from the API", async () => {
    mockList.mockResolvedValue([
      {
        id: "e-1",
        event: "store_view",
        page: "/store",
        created_at: "2026-10-01T12:00:00.000Z",
      },
    ]);
    const Page = (await import("@/app/(admin)/admin/store/analytics/page")).default;
    render(await Page());

    expect(mockList).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Recent Events (1)")).toBeInTheDocument();
    expect(screen.getAllByText("store_view").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("/store")).toBeInTheDocument();
  });

  it("shows a data error note when the live summary fails", async () => {
    mockSummary.mockRejectedValue(new Error("rpc missing"));
    mockList.mockRejectedValue(new Error("rpc missing"));
    const Page = (await import("@/app/(admin)/admin/store/analytics/page")).default;
    render(await Page());

    expect(screen.getByRole("status")).toHaveTextContent(/could not load store analytics/i);
  });

  it("renders event name chips", async () => {
    const Page = (await import("@/app/(admin)/admin/store/analytics/page")).default;
    render(await Page());
    expect(screen.getByText("store_view")).toBeInTheDocument();
    expect(screen.getByText("quiz_complete")).toBeInTheDocument();
    expect(screen.getByText("quote_submit")).toBeInTheDocument();
    expect(screen.getByText("product_detail_view")).toBeInTheDocument();
  });

  it("renders event shape fields", async () => {
    const Page = (await import("@/app/(admin)/admin/store/analytics/page")).default;
    render(await Page());
    expect(screen.getByText("event")).toBeInTheDocument();
    expect(screen.getByText("sessionId")).toBeInTheDocument();
    expect(screen.getByText("entityType")).toBeInTheDocument();
  });

  it("renders privacy rules", async () => {
    const Page = (await import("@/app/(admin)/admin/store/analytics/page")).default;
    render(await Page());
    expect(screen.getByText(/Do not track secrets/)).toBeInTheDocument();
    expect(screen.getByText(/Respect consent\/cookie approach/)).toBeInTheDocument();
  });
});
