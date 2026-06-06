import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockAuditList = jest.fn();
const mockOrgsList = jest.fn();
const mockProfilesList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    audit: { list: mockAuditList },
    organizations: { list: mockOrgsList },
    profiles: { list: mockProfilesList },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const baseLog = {
  id: "log1",
  action: "user.login",
  entity_type: "user",
  entity_id: "u1",
  actor_user_id: "actor1",
  actor_type: "user",
  organization_id: "o1",
  created_at: new Date().toISOString(),
  metadata: { ip: "127.0.0.1" },
};

describe("AuditPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockAuditList.mockResolvedValue({ items: [baseLog], total: 1, page: 1, limit: 50 });
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme Corp" }]);
    mockProfilesList.mockResolvedValue([{ id: "actor1", full_name: "Alice Smith", email: "alice@test.com" }]);
  });

  it("renders title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/audit/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("heading", { name: "Audit & Activity" })).toBeInTheDocument();
    expect(screen.getByText(/Review recent administrative actions/)).toBeInTheDocument();
  });

  it("renders back to admin link", async () => {
    const Page = (await import("@/app/(admin)/admin/audit/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    const backLink = screen.getByRole("link", { name: /Back to Admin/ });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/admin");
  });

  it("renders filter form with selects", async () => {
    const Page = (await import("@/app/(admin)/admin/audit/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByDisplayValue("All Actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply Filters" })).toBeInTheDocument();
  });

  it("renders audit log entries", async () => {
    const Page = (await import("@/app/(admin)/admin/audit/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Recent Events")).toBeInTheDocument();
    expect(screen.getByText("user.login")).toBeInTheDocument();
  });

  it("shows actor name from profile", async () => {
    const Page = (await import("@/app/(admin)/admin/audit/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
  });

  it("shows org name from organization", async () => {
    const Page = (await import("@/app/(admin)/admin/audit/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
  });

  it("shows metadata JSON when present", async () => {
    const Page = (await import("@/app/(admin)/admin/audit/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/"ip"/)).toBeInTheDocument();
  });

  it("renders empty state when no logs", async () => {
    mockAuditList.mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 });
    const Page = (await import("@/app/(admin)/admin/audit/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("No audit logs found for the selected filters.")).toBeInTheDocument();
  });

  it("shows actor email when no full_name", async () => {
    mockProfilesList.mockResolvedValue([{ id: "actor1", full_name: null, email: "bob@test.com" }]);
    const Page = (await import("@/app/(admin)/admin/audit/page")).default;
    render(await Page({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/bob@test.com/)).toBeInTheDocument();
  });
});
