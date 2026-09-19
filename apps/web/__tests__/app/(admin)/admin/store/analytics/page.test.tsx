import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

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
  });

  it("renders page shell with title and event count", async () => {
    const Page = (await import("@/app/(admin)/admin/store/analytics/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Analytics Event Registry" })).toBeInTheDocument();
    expect(screen.getByText(/\d+ tracked event types/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
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

  it("renders dashboard cards section", async () => {
    const Page = (await import("@/app/(admin)/admin/store/analytics/page")).default;
    render(await Page());
    expect(screen.getByText("Dashboard Cards")).toBeInTheDocument();
    expect(screen.getByText("Top viewed products")).toBeInTheDocument();
    expect(screen.getByText("Quiz completion rate")).toBeInTheDocument();
    expect(screen.getByText("Quote submissions")).toBeInTheDocument();
  });
});
