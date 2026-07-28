import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    final: { sharepoint: { list: mockList } },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createSharePoint: jest.fn(),
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

describe("SharePointPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/final/sharepoint/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "SharePoint Plan" })).toBeInTheDocument();
    expect(screen.getByText(/Plan SharePoint sites/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/final/sharepoint/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("final");
  });

  it("renders CrudForm with New SharePoint Plan title", async () => {
    const Page = (await import("@/app/(admin)/admin/final/sharepoint/page")).default;
    render(await Page());
    expect(screen.getByText("New SharePoint Plan")).toBeInTheDocument();
  });

  it("renders empty state when no SharePoint plans", async () => {
    const Page = (await import("@/app/(admin)/admin/final/sharepoint/page")).default;
    render(await Page());
    expect(screen.getByText("No SharePoint plans")).toBeInTheDocument();
  });

  it("renders items list when plans exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "s1", site_name: "HR Documents" },
        { id: "s2", site_name: "IT Knowledge Base" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/final/sharepoint/page")).default;
    render(await Page());
    expect(screen.getByText("HR Documents")).toBeInTheDocument();
    expect(screen.getByText("IT Knowledge Base")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/final/sharepoint/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/final/sharepoint/page")).default;
    render(await Page());
    expect(screen.getByText("No SharePoint plans")).toBeInTheDocument();
  });
});
