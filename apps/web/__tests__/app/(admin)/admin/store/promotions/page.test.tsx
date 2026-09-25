import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockListPromotions = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    store: { listPromotions: mockListPromotions },
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

jest.mock("@/app/(admin)/admin/store/promotions/PromoForm", () => {
  return function MockPromoForm({ mode, promotion, children }: any) {
    return (
      <form data-testid="promo-form" data-mode={mode} data-promo-id={promotion?.id}>
        {children}
      </form>
    );
  };
});

jest.mock("@/app/(admin)/admin/store/promotions/DeleteButton", () => {
  return function MockDeleteButton({ id }: any) {
    return <button data-testid="delete-button" data-id={id}>Delete</button>;
  };
});

function mockPromotion(overrides: Record<string, unknown> = {}) {
  return {
    id: "promo-1",
    name: "Summer Bundle Savings",
    badge_text: "Save 20%",
    detail_text: "Summer savings on security bundles.",
    promo_type: "bundle_savings",
    status: "active",
    terms: "Valid through August.",
    eligibility_targets: ["all"],
    start_date: "2026-06-01T00:00:00Z",
    end_date: "2026-08-31T00:00:00Z",
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

describe("AdminStorePromotionsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockListPromotions.mockResolvedValue([]);
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/store/promotions/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Promotions" })).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no promotions", async () => {
    const Page = (await import("@/app/(admin)/admin/store/promotions/page")).default;
    render(await Page());
    expect(screen.getAllByText(/No promotions yet/).length).toBeGreaterThan(0);
  });

  it("renders promotion rows with name, type, and status", async () => {
    mockListPromotions.mockResolvedValue([
      mockPromotion(),
      mockPromotion({
        id: "promo-2",
        name: "Starter Credit",
        status: "paused",
        promo_type: "starter_credit",
      }),
    ]);
    const Page = (await import("@/app/(admin)/admin/store/promotions/page")).default;
    render(await Page());
    expect(screen.getAllByText("Summer Bundle Savings").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Starter Credit").length).toBeGreaterThan(0);
    expect(screen.getAllByText("active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("paused").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bundle Savings").length).toBeGreaterThan(0);
  });

  it("renders create form button", async () => {
    const Page = (await import("@/app/(admin)/admin/store/promotions/page")).default;
    render(await Page());
    expect(screen.getByText("Create Promotion")).toBeInTheDocument();
    expect(screen.getByTestId("promo-form").getAttribute("data-mode")).toBe("create");
  });

  it("renders edit and delete actions per promotion", async () => {
    mockListPromotions.mockResolvedValue([mockPromotion()]);
    const Page = (await import("@/app/(admin)/admin/store/promotions/page")).default;
    render(await Page());
    const editForms = screen.getAllByTestId("promo-form").filter(
      (f) => f.getAttribute("data-mode") === "edit",
    );
    expect(editForms.length).toBe(2);
    expect(screen.getAllByTestId("delete-button").length).toBe(2);
  });

  it("shows validation warnings for invalid active promotions", async () => {
    mockListPromotions.mockResolvedValue([
      mockPromotion({ name: "", badge_text: "" }),
    ]);
    const Page = (await import("@/app/(admin)/admin/store/promotions/page")).default;
    render(await Page());
    expect(screen.getAllByText(/Name is required/).length).toBeGreaterThan(0);
  });
});
