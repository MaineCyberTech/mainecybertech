import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockFileRequestsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    fileRequests: { list: mockFileRequestsList },
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

describe("FileRequestsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockFileRequestsList.mockResolvedValue({ items: [] });
  });

  it("renders page title", async () => {
    const Page = (await import("@/app/(admin)/admin/file-requests/page")).default;
    render(await Page());
    expect(
      screen.getByRole("heading", { name: /secure file request portal/i }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/file-requests/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("file-requests");
  });

  it("shows empty state when no data", async () => {
    const Page = (await import("@/app/(admin)/admin/file-requests/page")).default;
    render(await Page());
    expect(screen.getByText(/no file requests/i)).toBeInTheDocument();
  });

  it("renders items when data exists", async () => {
    mockFileRequestsList.mockResolvedValue({
      items: [
        {
          id: "1",
          title: "Test Request",
          status: "active",
          token: "tok_abc123",
          expires_at: "2026-12-31T00:00:00Z",
          upload_count: 3,
          max_files: 10,
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const Page = (await import("@/app/(admin)/admin/file-requests/page")).default;
    render(await Page());
    expect(screen.getByText("Test Request")).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/file-requests/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    mockFileRequestsList.mockRejectedValue(new Error("API down"));
    const Page = (await import("@/app/(admin)/admin/file-requests/page")).default;
    render(await Page());
    expect(screen.getByText(/no file requests/i)).toBeInTheDocument();
  });
});
