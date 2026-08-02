import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockRequirePermission = jest.fn();
jest.mock("@/lib/auth/permissions", () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
}));

const mockOrgsList = jest.fn();
const mockApiKeysList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { list: mockOrgsList },
    apiKeys: { list: mockApiKeysList },
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

jest.mock("@/components/admin/AdminApiKeysClient", () => {
  return function MockAdminApiKeysClient({ organizations, initialKeys }: any) {
    return (
      <div data-testid="api-keys-client">
        <span data-testid="org-count">{organizations.length}</span>
        <span data-testid="key-count">{initialKeys.length}</span>
      </div>
    );
  };
});

describe("AdminApiKeysPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockOrgsList.mockResolvedValue([]);
    mockApiKeysList.mockResolvedValue([]);
  });

  it("renders page title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/api-keys/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "API Keys" })).toBeInTheDocument();
    expect(screen.getByText(/Manage API keys for programmatic access/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/api-keys/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("api-keys");
  });

  it("renders AdminApiKeysClient with organizations and keys", async () => {
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Org 1" }]);
    mockApiKeysList.mockResolvedValue([
      { id: "k1", name: "Key 1", key: "mct_xxx", organization_id: "o1" },
    ]);
    const Page = (await import("@/app/(admin)/admin/api-keys/page")).default;
    render(await Page());
    expect(screen.getByTestId("api-keys-client")).toBeInTheDocument();
    expect(screen.getByTestId("org-count")).toHaveTextContent("1");
    expect(screen.getByTestId("key-count")).toHaveTextContent("1");
  });

  it("passes empty arrays when no data", async () => {
    const Page = (await import("@/app/(admin)/admin/api-keys/page")).default;
    render(await Page());
    expect(screen.getByTestId("org-count")).toHaveTextContent("0");
    expect(screen.getByTestId("key-count")).toHaveTextContent("0");
  });

  it("calls requireAdminAccess", async () => {
    const Page = (await import("@/app/(admin)/admin/api-keys/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });
});
