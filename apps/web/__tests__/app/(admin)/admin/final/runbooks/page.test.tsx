import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    final: { runbooks: { list: mockList } },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createRunbook: jest.fn(),
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

describe("RunbookPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/final/runbooks/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Client Runbook" })).toBeInTheDocument();
    expect(screen.getByText(/Client runbooks with categories/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/final/runbooks/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("final");
  });

  it("renders CrudForm with New Runbook title", async () => {
    const Page = (await import("@/app/(admin)/admin/final/runbooks/page")).default;
    render(await Page());
    expect(screen.getByText("New Runbook")).toBeInTheDocument();
  });

  it("renders empty state when no runbooks", async () => {
    const Page = (await import("@/app/(admin)/admin/final/runbooks/page")).default;
    render(await Page());
    expect(screen.getByText("No runbooks")).toBeInTheDocument();
  });

  it("renders items list when runbooks exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "r1", title: "Onboarding Runbook" },
        { id: "r2", title: "Incident Response" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/final/runbooks/page")).default;
    render(await Page());
    expect(screen.getByText("Onboarding Runbook")).toBeInTheDocument();
    expect(screen.getByText("Incident Response")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/final/runbooks/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/final/runbooks/page")).default;
    render(await Page());
    expect(screen.getByText("No runbooks")).toBeInTheDocument();
  });
});
