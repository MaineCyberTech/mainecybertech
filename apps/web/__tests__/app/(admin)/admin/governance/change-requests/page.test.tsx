import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    governance: { changes: { list: mockList } },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createChangeRequest: jest.fn(),
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

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

describe("ChangeRequestPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/change-requests/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Change Request" })).toBeInTheDocument();
    expect(screen.getByText(/Change advisory requests/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/change-requests/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("governance");
  });

  it("renders CrudForm with New Change Request title", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/change-requests/page")).default;
    render(await Page());
    expect(screen.getByText("New Change Request")).toBeInTheDocument();
  });

  it("renders empty state when no change requests", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/change-requests/page")).default;
    render(await Page());
    expect(screen.getByText("No change requests")).toBeInTheDocument();
  });

  it("renders items list when requests exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "c1", title: "Firewall Rule Update" },
        { id: "c2", title: "DNS Migration" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/governance/change-requests/page")).default;
    render(await Page());
    expect(screen.getByText("Firewall Rule Update")).toBeInTheDocument();
    expect(screen.getByText("DNS Migration")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/change-requests/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/governance/change-requests/page")).default;
    render(await Page());
    expect(screen.getByText("No change requests")).toBeInTheDocument();
  });
});
