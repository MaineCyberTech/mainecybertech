import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockInsuranceBinderList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    insuranceBinder: { list: mockInsuranceBinderList },
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

describe("InsuranceBinderPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockInsuranceBinderList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with heading 'Insurance Evidence Binder'", async () => {
    const Page = (await import("@/app/(admin)/admin/insurance-binder/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Insurance Evidence Binder" })).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/insurance-binder/page")).default;
    render(await Page());
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs", async () => {
    const Page = (await import("@/app/(admin)/admin/insurance-binder/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
  });

  it("shows 'Add Evidence' button", async () => {
    const Page = (await import("@/app/(admin)/admin/insurance-binder/page")).default;
    render(await Page());
    expect(screen.getAllByText("Add Evidence").length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/insurance-binder/page")).default;
    render(await Page());
    expect(screen.getByText("No evidence collected yet")).toBeInTheDocument();
  });

  it("renders list items with title and coverage area when data exists", async () => {
    mockInsuranceBinderList.mockResolvedValue({
      items: [
        {
          id: "1",
          title: "SOC 2 Report",
          evidence_type: "Report",
          coverage_area: "Access Control",
          status: "active",
          expiry_date: null,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/insurance-binder/page")).default;
    render(await Page());
    expect(screen.getByText("SOC 2 Report")).toBeInTheDocument();
    expect(screen.getByText(/Access Control/)).toBeInTheDocument();
  });
});
