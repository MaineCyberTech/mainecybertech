import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockStatusPageComponentsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    statusPage: { components: { list: mockStatusPageComponentsList } },
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

describe("StatusPagesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockStatusPageComponentsList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with heading 'Status Pages'", async () => {
    const Page = (await import("@/app/(admin)/admin/status-pages/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Status Pages" })).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/status-pages/page")).default;
    render(await Page());
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs", async () => {
    const Page = (await import("@/app/(admin)/admin/status-pages/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
  });

  it("does not show removed action buttons", async () => {
    const Page = (await import("@/app/(admin)/admin/status-pages/page")).default;
    render(await Page());
    expect(screen.queryByText("Add Component")).toBeNull();
  });

  it("shows empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/status-pages/page")).default;
    render(await Page());
    expect(screen.getByText("No status components defined")).toBeInTheDocument();
  });

  it("renders list items with name and component_type when data exists", async () => {
    mockStatusPageComponentsList.mockResolvedValue({
      items: [
        {
          id: "1",
          name: "API Service",
          component_type: "API",
          status: "operational",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/status-pages/page")).default;
    render(await Page());
    expect(screen.getByText("API Service")).toBeInTheDocument();
    expect(screen.getByText(/API • 2026-01-01/)).toBeInTheDocument();
  });
});
