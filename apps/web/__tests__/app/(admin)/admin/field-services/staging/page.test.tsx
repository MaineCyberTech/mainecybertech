import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockStagingList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    staging: { list: mockStagingList },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createStaging: jest.fn(),
}));

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

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crudform">{title}</div>;
  };
});

jest.mock("@/components/admin/AdminPagination", () => {
  return function MockAdminPagination() {
    return <nav data-testid="pagination" />;
  };
});

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("StagingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockStagingList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/staging/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { name: "Hardware Staging" })).toBeInTheDocument();
    expect(screen.getByText(/Track device staging with type/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/staging/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("field-services");
  });

  it("renders total pill", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/staging/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("0 Total")).toBeInTheDocument();
  });

  it("renders CrudForm for new device", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/staging/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("crudform")).toHaveTextContent("New Device");
  });

  it("renders empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/staging/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("No staged devices")).toBeInTheDocument();
  });

  it("renders items list when items exist", async () => {
    mockStagingList.mockResolvedValue({
      items: [
        { id: "s1", device_name: "Dell OptiPlex 7090", asset_tag: "TAG-1", status: "pending", created_at: "2026-01-01T00:00:00Z" },
      ],
      total: 1,
    });
    const Page = (await import("@/app/(admin)/admin/field-services/staging/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Dell OptiPlex 7090")).toBeInTheDocument();
    expect(screen.getByText(/Tag: TAG-1/)).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/field-services/staging/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockStagingList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/field-services/staging/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("No staged devices")).toBeInTheDocument();
  });
});
