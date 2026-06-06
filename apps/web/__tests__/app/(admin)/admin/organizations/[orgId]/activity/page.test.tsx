import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockOrgsGet = jest.fn();
const mockAuditList = jest.fn();
const mockProfilesList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { get: mockOrgsGet },
    audit: { list: mockAuditList },
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

const baseLog = { id: "log1", action: "org.update", entity_type: "organization", entity_id: "o1", actor_user_id: "u1", organization_id: "o1", actor_type: "user", created_at: new Date().toISOString(), metadata: null };

describe("OrganizationActivityPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockOrgsGet.mockResolvedValue({ id: "o1", name: "Acme Corp" });
    mockAuditList.mockResolvedValue({ items: [baseLog] });
    mockProfilesList.mockResolvedValue([{ id: "u1", full_name: "Bob Admin", email: "bob@a.com" }]);
  });

  it("renders title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByRole("heading", { name: "Acme Corp Activity" })).toBeInTheDocument();
    expect(screen.getByText(/Timeline of actions associated with this organization/)).toBeInTheDocument();
  });

  it("renders back link", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    const backLink = screen.getByText("Back to Organization").closest("a");
    expect(backLink).toHaveAttribute("href", "/admin/organizations/o1");
  });

  it("renders audit log entries", async () => {
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("org.update")).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes("Entity: organization"))).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes("Actor:") && c.includes("Bob Admin"))).toBeInTheDocument();
  });

  it("renders empty state", async () => {
    mockAuditList.mockResolvedValue({ items: [] });
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("No activity found for this organization.")).toBeInTheDocument();
  });

  it("uses fallback title when org not found", async () => {
    mockOrgsGet.mockRejectedValue(new Error("not found"));
    mockAuditList.mockResolvedValue({ items: [] });
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText("Organization Activity")).toBeInTheDocument();
  });

  it("shows actor email when no full_name", async () => {
    mockProfilesList.mockResolvedValue([{ id: "u1", full_name: null, email: "user@test.com" }]);
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText((c) => c.includes("Actor:") && c.includes("user@test.com"))).toBeInTheDocument();
  });

  it("shows actor_type when no profile", async () => {
    mockProfilesList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/organizations/[orgId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ orgId: "o1" }) }));
    expect(screen.getByText((c) => c.includes("Actor:") && c.includes("user"))).toBeInTheDocument();
  });
});
