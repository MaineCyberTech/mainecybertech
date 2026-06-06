import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockOrgsList = jest.fn();
const mockMembershipsList = jest.fn();
const mockProfilesList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    organizations: { list: mockOrgsList },
    memberships: { list: mockMembershipsList },
    profiles: { list: mockProfilesList },
  }),
}));

jest.mock("@/components/admin/AdminBreadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.length} items</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

jest.mock("@/app/(admin)/admin/approvals/actions", () => ({
  approveOrganization: jest.fn(),
  rejectOrganization: jest.fn(),
  approveMembership: jest.fn(),
  rejectMembership: jest.fn(),
}));

describe("ApprovalQueuePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
  });

  it("renders page shell with title", async () => {
    mockOrgsList.mockResolvedValue([]);
    mockMembershipsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/approvals/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Approval Queue" })).toBeInTheDocument();
    expect(screen.getByText(/Review pending organizations/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    mockOrgsList.mockResolvedValue([]);
    mockMembershipsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/approvals/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("approvals");
  });

  it("shows pending counts as zero", async () => {
    mockOrgsList.mockResolvedValue([]);
    mockMembershipsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/approvals/page")).default;
    render(await Page());
    expect(screen.getByText("Pending Orgs: 0")).toBeInTheDocument();
    expect(screen.getByText("Pending Users: 0")).toBeInTheDocument();
  });

  it("renders empty state for orgs and memberships", async () => {
    mockOrgsList.mockResolvedValue([]);
    mockMembershipsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/approvals/page")).default;
    render(await Page());
    expect(screen.getByText("No pending organizations.")).toBeInTheDocument();
    expect(screen.getByText("No pending memberships.")).toBeInTheDocument();
  });

  it("renders pending organizations with approve/reject", async () => {
    mockOrgsList.mockResolvedValue([{ id: "org-1", name: "New Org", slug: "new-org", primary_domain: "new.org" }]);
    mockMembershipsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/approvals/page")).default;
    render(await Page());
    expect(screen.getByText("New Org")).toBeInTheDocument();
    expect(screen.getByText(/new-org/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve Org" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject Org" })).toBeInTheDocument();
  });

  it("renders pending memberships with profile and org info", async () => {
    mockOrgsList.mockResolvedValueOnce([{ id: "o1", name: "Acme Corp" }]);
    mockMembershipsList.mockResolvedValue([
      { id: "m1", user_id: "u1", organization_id: "o1", status: "pending" },
    ]);
    mockProfilesList.mockResolvedValue([{ id: "u1", full_name: "Jane Doe", email: "jane@test.com" }]);
    const Page = (await import("@/app/(admin)/admin/approvals/page")).default;
    render(await Page());
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/jane@test.com/)).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve User" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject User" })).toBeInTheDocument();
  });

  it("handles unknown profile/org for pending memberships", async () => {
    mockOrgsList.mockResolvedValueOnce([]);
    mockMembershipsList.mockResolvedValue([
      { id: "m1", user_id: "u-missing", organization_id: "o-missing", status: "pending" },
    ]);
    mockProfilesList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/approvals/page")).default;
    render(await Page());
    expect(screen.getByText("Unknown User")).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("Unknown Org"))).toBeInTheDocument();
  });

  it("calls requireAdminAccess", async () => {
    mockOrgsList.mockResolvedValue([]);
    mockMembershipsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/approvals/page")).default;
    render(await Page());
    expect(mockRequireAdminAccess).toHaveBeenCalled();
  });
});
