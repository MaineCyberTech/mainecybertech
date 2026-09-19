import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

jest.mock("@/lib/module-actions", () => ({}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    eduAutomation: { kbGenerator: { list: mockList } },
  }),
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

describe("KbGenPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/kb-generator/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "KB Generator" })).toBeInTheDocument();
    expect(screen.getByText(/Auto-generate knowledge base articles/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/kb-generator/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("edu-automation");
  });

  it("renders empty state when no items", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/kb-generator/page")).default;
    render(await Page());
    expect(screen.getByText("No KB generated entries")).toBeInTheDocument();
  });

  it("renders items list when items exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "g1", source_title: "Network Security Guide" },
        { id: "g2", source_title: "Cloud Migration Doc" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/edu-automation/kb-generator/page")).default;
    render(await Page());
    expect(screen.getByText("Network Security Guide")).toBeInTheDocument();
    expect(screen.getByText("Cloud Migration Doc")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/edu-automation/kb-generator/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/edu-automation/kb-generator/page")).default;
    render(await Page());
    expect(screen.getByText("No KB generated entries")).toBeInTheDocument();
  });
});
