import { render, screen } from "@testing-library/react";
import { setupAdminPageMocks } from "@/lib/test-utils";

let mocks: ReturnType<typeof setupAdminPageMocks>;

const mockBreakGlassList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    securityOps: { breakGlass: { list: mockBreakGlassList } },
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

jest.mock("@/components/EmptyState", () => {
  return function MockEmptyState({ title, description }: any) {
    return (
      <div data-testid="empty-state">
        <p>{title}</p>
        <p>{description}</p>
      </div>
    );
  };
});

jest.mock("@/components/admin/CrudForm", () => {
  return function MockCrudForm({ title }: any) {
    return <div data-testid="crud-form">{title}</div>;
  };
});

jest.mock("@/lib/module-actions", () => ({
  createBreakGlass: jest.fn(),
}));

describe("AdminBreakGlassPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocks = setupAdminPageMocks();
    mockBreakGlassList.mockResolvedValue({ items: [] });
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/break-glass/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: "Emergency Access Break Glass Register" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Track break-glass accounts/)).toBeInTheDocument();
    expect(mocks.requireAdminAccess).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/break-glass/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("break-glass");
  });

  it("shows empty state when no accounts", async () => {
    const Page = (await import("@/app/(admin)/admin/break-glass/page")).default;
    render(await Page());
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No break-glass accounts")).toBeInTheDocument();
  });

  it("renders crud form for new entry", async () => {
    const Page = (await import("@/app/(admin)/admin/break-glass/page")).default;
    render(await Page());
    expect(screen.getByTestId("crud-form")).toHaveTextContent("New Break Glass");
  });

  it("renders account items with name and system", async () => {
    mockBreakGlassList.mockResolvedValue({
      items: [
        {
          id: "bg1",
          account_name: "admin-root",
          system: "AWS",
          custodian_name: "Alice",
          last_rotated_at: "2025-12-01T00:00:00Z",
          next_rotation_at: "2026-06-01T00:00:00Z",
          status: "active",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/break-glass/page")).default;
    render(await Page());
    expect(screen.getByText("admin-root — AWS")).toBeInTheDocument();
  });
});
