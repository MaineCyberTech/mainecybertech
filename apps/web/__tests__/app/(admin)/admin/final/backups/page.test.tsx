import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    final: { backups: { list: mockList } },
  }),
}));

jest.mock("@/lib/module-actions", () => ({
  createBackup: jest.fn(),
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

describe("BackupPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockList.mockResolvedValue({ items: [] });
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/final/backups/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Backup DR" })).toBeInTheDocument();
    expect(screen.getByText(/Backup and disaster recovery planning/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/final/backups/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("final");
  });

  it("renders CrudForm with New Backup Plan title", async () => {
    const Page = (await import("@/app/(admin)/admin/final/backups/page")).default;
    render(await Page());
    expect(screen.getByText("New Backup Plan")).toBeInTheDocument();
  });

  it("renders empty state when no backup plans", async () => {
    const Page = (await import("@/app/(admin)/admin/final/backups/page")).default;
    render(await Page());
    expect(screen.getByText("No backup plans")).toBeInTheDocument();
  });

  it("renders items list when plans exist", async () => {
    mockList.mockResolvedValue({
      items: [
        { id: "b1", system_name: "SQL Server Backup" },
        { id: "b2", system_name: "File Server Backup" },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/final/backups/page")).default;
    render(await Page());
    expect(screen.getByText("SQL Server Backup")).toBeInTheDocument();
    expect(screen.getByText("File Server Backup")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/final/backups/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/final/backups/page")).default;
    render(await Page());
    expect(screen.getByText("No backup plans")).toBeInTheDocument();
  });
});
