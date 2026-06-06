import { render, screen } from "@testing-library/react";

const mockRequireAdminAccess = jest.fn();
jest.mock("@/lib/auth/admin", () => ({
  requireAdminAccess: (...args: any[]) => mockRequireAdminAccess(...args),
}));

const mockProjectsGetDetail = jest.fn();
jest.mock("@/lib/api", () => ({
  getApiClient: () => ({
    projects: {
      getDetail: mockProjectsGetDetail,
    },
  }),
}));

jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  );
});

jest.mock("@/components/admin/AdminBreadcrumbs", () => {
  return function MockBreadcrumbs({ items }: any) {
    return <nav data-testid="breadcrumbs">{items.map((i: any) => i.label).join(" > ")}</nav>;
  };
});

jest.mock("@/components/admin/AdminSubnav", () => {
  return function MockSubnav({ current }: any) {
    return <nav data-testid="subnav">{current}</nav>;
  };
});

jest.mock("@/components/admin/AdminPageShell", () => {
  return function MockPageShell({ title, description, breadcrumbs, subnav, actions, children }: any) {
    return (
      <div>
        {breadcrumbs}
        {subnav}
        <h1 data-testid="page-title">{title}</h1>
        <p data-testid="page-desc">{description}</p>
        <div data-testid="page-actions">{actions}</div>
        <div data-testid="page-children">{children}</div>
      </div>
    );
  };
});

jest.mock("@/components/admin/ProjectTaskListV5", () => {
  return function MockTaskList({ projectId, organizationId, tasks, owners }: any) {
    return (
      <div data-testid="task-list">
        <span data-testid="task-count">{tasks.length}</span>
        <span data-testid="owner-count">{owners.length}</span>
      </div>
    );
  };
});

jest.mock("@/app/(admin)/admin/projects/[projectId]/actions", () => ({
  reorderProjectTasks: jest.fn(),
  updateProjectBasics: jest.fn(),
  addProjectTask: jest.fn(),
  submitProjectTaskForm: jest.fn(),
  addAdminTaskComment: jest.fn(),
  updateAdminTaskComment: jest.fn(),
  deleteAdminTaskComment: jest.fn(),
  markProjectTaskCommentsRead: jest.fn(),
  addProjectUpdate: jest.fn(),
  submitProjectUpdateForm: jest.fn(),
}));

const baseProject = {
  id: "p1", name: "Security Audit", description: "Q2 audit", organization_id: "o1",
  status: "active", priority: "high",
};

function makeDetail(projectOverrides: Record<string, any> = {}, extra: Record<string, any> = {}) {
  return {
    project: { ...baseProject, ...projectOverrides, project_tasks: extra.tasks ?? [] },
    memberships: extra.memberships ?? [],
    profiles: extra.profiles ?? [],
    roles: extra.roles ?? [],
    tasks: extra.tasks ?? [],
    comments: extra.comments ?? [],
    readStates: extra.readStates ?? [],
  };
}

describe("AdminProjectDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdminAccess.mockResolvedValue(undefined);
    mockProjectsGetDetail.mockResolvedValue(makeDetail());
  });

  it("renders project not found error", async () => {
    mockProjectsGetDetail.mockRejectedValue(new Error("not found"));
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "bad" }) }));
    expect(screen.getByText("Project not found.")).toBeInTheDocument();
  });

  it("renders breadcrumbs and subnav", async () => {
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent("Security Audit");
    expect(screen.getByTestId("subnav")).toHaveTextContent("projects");
  });

  it("renders page shell with title and description", async () => {
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    expect(screen.getByTestId("page-title")).toHaveTextContent("Security Audit");
    expect(screen.getByTestId("page-desc")).toHaveTextContent("Q2 audit");
  });

  it("shows status and priority pills", async () => {
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("renders action links", async () => {
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    expect(screen.getByText("Back to Projects")).toBeInTheDocument();
    expect(screen.getByText("Open Portal")).toBeInTheDocument();
  });

  it("links open portal to project detail", async () => {
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    const portalLink = screen.getByText("Open Portal").closest("a");
    expect(portalLink).toHaveAttribute("href", "/portal/projects/p1");
  });

  it("renders ProjectTaskListV5 with tasks and owners", async () => {
    mockProjectsGetDetail.mockResolvedValue(makeDetail({}, {
      memberships: [{ id: "m1", user_id: "u1", organization_id: "o1", status: "approved" }],
      profiles: [{ id: "u1", full_name: "Alice", email: "alice@t.com" }],
      tasks: [{ id: "t1", title: "Task 1", created_by: "u1", owner_id: "u1" }],
    }));
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    expect(screen.getByTestId("task-list")).toBeInTheDocument();
    expect(screen.getByTestId("task-count")).toHaveTextContent("1");
    expect(screen.getByTestId("owner-count")).toHaveTextContent("1");
  });

  it("handles empty tasks", async () => {
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    expect(screen.getByTestId("task-count")).toHaveTextContent("0");
  });

  it("uses fallback description", async () => {
    mockProjectsGetDetail.mockResolvedValue(makeDetail({ description: null }));
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    expect(screen.getByTestId("page-desc")).toHaveTextContent("Admin project workspace");
  });

  it("shows blocked status pill", async () => {
    mockProjectsGetDetail.mockResolvedValue(makeDetail({ status: "blocked" }));
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    expect(screen.getByText("blocked")).toBeInTheDocument();
  });

  it("shows completed status and low priority pills", async () => {
    mockProjectsGetDetail.mockResolvedValue(makeDetail({ status: "completed", priority: "low" }));
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("low")).toBeInTheDocument();
  });

  it("handles task comments with unread count", async () => {
    mockProjectsGetDetail.mockResolvedValue(makeDetail({}, {
      memberships: [{ id: "m1", user_id: "u1", organization_id: "o1", status: "approved" }],
      profiles: [{ id: "u1", full_name: "Alice", email: "a@t.com" }],
      tasks: [{ id: "t1", title: "Task 1", created_by: "u1", owner_id: "u1" }],
      comments: [{ id: "c1", task_id: "t1", author_id: "u1", body: "Nice work", is_internal: false, created_at: new Date().toISOString() }],
    }));
    const Page = (await import("@/app/(admin)/admin/projects/[projectId]/page")).default;
    render(await Page({ params: Promise.resolve({ projectId: "p1" }) }));
    expect(screen.getByTestId("task-count")).toHaveTextContent("1");
  });
});