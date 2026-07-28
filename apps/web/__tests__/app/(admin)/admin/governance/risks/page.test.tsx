import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    governance: { risks: { list: mockList } },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createRisk: jest.fn(),
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

describe("RiskRegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/risks/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Risk Register" })).toBeInTheDocument();
    expect(screen.getByText(/Risk tracking with categories/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/risks/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("governance");
  });

  it("renders CrudForm with New Risk title", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/risks/page")).default;
    render(await Page());
    expect(screen.getByText("New Risk")).toBeInTheDocument();
  });

  it("renders empty state when no risks", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/risks/page")).default;
    render(await Page());
    expect(screen.getByText("No risks registered")).toBeInTheDocument();
  });

  it("renders items list when risks exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "r1", risk_description: "Data breach risk" },
        { id: "r2", risk_description: "Ransomware threat" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/governance/risks/page")).default;
    render(await Page());
    expect(screen.getByText("Data breach risk")).toBeInTheDocument();
    expect(screen.getByText("Ransomware threat")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/governance/risks/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/governance/risks/page")).default;
    render(await Page());
    expect(screen.getByText("No risks registered")).toBeInTheDocument();
  });
});
