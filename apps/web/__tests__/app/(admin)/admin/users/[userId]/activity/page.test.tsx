import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockProfilesGet = jest.fn();
const mockAuditList = jest.fn();
const mockOrgsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    profiles: { get: mockProfilesGet },
    audit: { list: mockAuditList },
    organizations: { list: mockOrgsList },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

const baseLog = { id: "log1", action: "user.login", entity_type: "session", entity_id: null, organization_id: "o1", actor_user_id: "u1", created_at: new Date().toISOString(), metadata: null };

describe("UserActivityPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockProfilesGet.mockResolvedValue({ id: "u1", full_name: "Alice Smith" });
    mockAuditList.mockResolvedValue({ items: [baseLog] });
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme Corp" }]);
  });

  it("renders title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/users/[userId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByRole("heading", { name: "Alice Smith Activity" })).toBeInTheDocument();
    expect(screen.getByText(/Timeline of actions performed by this user/)).toBeInTheDocument();
  });

  it("renders back link", async () => {
    const Page = (await import("@/app/(admin)/admin/users/[userId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    const backLink = screen.getByText("Back to User").closest("a");
    expect(backLink).toHaveAttribute("href", "/admin/users/u1");
  });

  it("renders audit log entries", async () => {
    const Page = (await import("@/app/(admin)/admin/users/[userId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("user.login")).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes("Entity: session"))).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes("Org:") && c.includes("Acme Corp"))).toBeInTheDocument();
  });

  it("renders empty state", async () => {
    mockAuditList.mockResolvedValue({ items: [] });
    const Page = (await import("@/app/(admin)/admin/users/[userId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("No activity found for this user.")).toBeInTheDocument();
  });

  it("uses fallback title when profile not found", async () => {
    mockProfilesGet.mockRejectedValue(new Error("not found"));
    mockAuditList.mockResolvedValue({ items: [] });
    const Page = (await import("@/app/(admin)/admin/users/[userId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText("User Activity")).toBeInTheDocument();
  });

  it("shows Global / None for missing org", async () => {
    const log = { ...baseLog, organization_id: null };
    mockAuditList.mockResolvedValue({ items: [log] });
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/users/[userId]/activity/page")).default;
    render(await Page({ params: Promise.resolve({ userId: "u1" }) }));
    expect(screen.getByText((c) => c.includes("Global") && c.includes("None"))).toBeInTheDocument();
  });
});
