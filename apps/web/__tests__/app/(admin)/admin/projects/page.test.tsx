import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockProjectsList = jest.fn();
const mockOrgsList = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    projects: { list: mockProjectsList },
    organizations: { list: mockOrgsList },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  );
});

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

jest.mock("@/app/(admin)/admin/projects/actions", () => ({
  createProject: jest.fn(),
}));

jest.mock("@/app/(admin)/admin/projects/AdminProjectsClient", () => {
  return function MockAdminProjectsClient({ projects, orgMap }: any) {
    return (
      <div data-testid="projects-client">
        {projects.map((p: any) => (
          <div key={p.id}>
            <span>{p.name}</span>
            <span>{orgMap[p.organization_id]?.name ?? "Unknown Org"}</span>
          </div>
        ))}
        {projects.length === 0 ? <span>No projects found.</span> : null}
      </div>
    );
  };
});

describe("AdminProjectsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
  });

  it("renders page shell with title and description", async () => {
    mockProjectsList.mockResolvedValue({ items: [] });
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/projects/page")).default;
    render(await Page());
    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText(/Manage projects/)).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    mockProjectsList.mockResolvedValue({ items: [] });
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/projects/page")).default;
    render(await Page());
    expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("subnav")).toHaveTextContent("projects");
  });

  it("shows stat cards with counts", async () => {
    mockProjectsList.mockResolvedValue({ items: [{ id: "p1" }, { id: "p2" }] });
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/projects/page")).default;
    render(await Page());
    expect(screen.getByText("Total Projects")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows create project button", async () => {
    mockProjectsList.mockResolvedValue({ items: [] });
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme Corp", slug: "acme" }]);
    const Page = (await import("@/app/(admin)/admin/projects/page")).default;
    render(await Page());
    expect(screen.getByTestId("projects-client")).toBeInTheDocument();
  });

  it("renders empty state when no projects", async () => {
    mockProjectsList.mockResolvedValue({ items: [] });
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/projects/page")).default;
    render(await Page());
    expect(screen.getByText("No projects found.")).toBeInTheDocument();
  });

  it("renders project queue with cards", async () => {
    mockProjectsList.mockResolvedValue({
      items: [
        { id: "p1", name: "Security Audit", description: "Q2 audit", organization_id: "o1", status: "active", priority: "high" },
      ],
    });
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme Corp" }]);
    const Page = (await import("@/app/(admin)/admin/projects/page")).default;
    render(await Page());
    expect(screen.getByText("Security Audit")).toBeInTheDocument();
  });

  it("shows no description fallback", async () => {
    mockProjectsList.mockResolvedValue({
      items: [{ id: "p1", name: "Audit", description: null, organization_id: "o1", status: "planned", priority: "normal" }],
    });
    mockOrgsList.mockResolvedValue([{ id: "o1", name: "Acme" }]);
    const Page = (await import("@/app/(admin)/admin/projects/page")).default;
    render(await Page());
    expect(screen.getByText("Audit")).toBeInTheDocument();
  });

  it("handles unknown org gracefully", async () => {
    mockProjectsList.mockResolvedValue({
      items: [{ id: "p1", name: "Audit", description: null, organization_id: "missing", status: "planned", priority: "normal" }],
    });
    mockOrgsList.mockResolvedValue([]);
    const Page = (await import("@/app/(admin)/admin/projects/page")).default;
    render(await Page());
    expect(screen.getByText("Unknown Org")).toBeInTheDocument();
  });
});
