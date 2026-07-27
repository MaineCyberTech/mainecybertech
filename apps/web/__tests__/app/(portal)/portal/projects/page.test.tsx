import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockProjectsList = jest.fn();
const mockProjectsListTasks = jest.fn();
const mockProjectsListTaskComments = jest.fn();
const mockProjectsListReadStates = jest.fn();
const mockUsersMe = jest.fn();
const mockGetApprovedMembership = jest.fn().mockResolvedValue({ organization_id: "org-1" });

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    React.createElement("a", { href, ...props }, children as React.ReactNode),
}));

jest.mock("@/lib/api", () => ({
  getApiClient: jest.fn().mockReturnValue({
    projects: {
      list: mockProjectsList,
      listTasks: mockProjectsListTasks,
      listTaskComments: mockProjectsListTaskComments,
      listReadStates: mockProjectsListReadStates,
    },
    users: { me: mockUsersMe },
  }),
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

describe("PortalProjectsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });
    mockUsersMe.mockResolvedValue({ userId: "user-1" });
    mockProjectsListTasks.mockResolvedValue([]);
    mockProjectsListTaskComments.mockResolvedValue([]);
    mockProjectsListReadStates.mockResolvedValue([]);
  });

  it("renders projects heading", async () => {
    mockProjectsList.mockResolvedValue({ items: [] });

    const { default: PortalProjectsPage } = await import("@/app/(portal)/portal/projects/page");
    const element = await PortalProjectsPage();
    render(element);

    expect(screen.getByRole("heading", { name: /projects/i })).toBeInTheDocument();
  });

  it("renders project cards when data exists", async () => {
    mockProjectsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          name: "Project Alpha",
          status: "active",
          priority: "high",
          updated_at: new Date().toISOString(),
        },
        {
          id: "p2",
          name: "Project Beta",
          status: "completed",
          priority: "normal",
          updated_at: new Date().toISOString(),
        },
      ],
    });

    const { default: PortalProjectsPage } = await import("@/app/(portal)/portal/projects/page");
    const element = await PortalProjectsPage();
    render(element);

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  it("renders empty state when no projects", async () => {
    mockProjectsList.mockResolvedValue({ items: [] });

    const { default: PortalProjectsPage } = await import("@/app/(portal)/portal/projects/page");
    const element = await PortalProjectsPage();
    render(element);

    expect(screen.getByText("No projects found.")).toBeInTheDocument();
  });

  it("shows access restricted when no org", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { default: PortalProjectsPage } = await import("@/app/(portal)/portal/projects/page");
    const element = await PortalProjectsPage();
    render(element);

    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
  });

  it("shows unread badge when unread comments exist", async () => {
    const now = new Date().toISOString();
    const oldDate = new Date(Date.now() - 100000).toISOString();

    mockProjectsList.mockResolvedValue({
      items: [
        { id: "p1", name: "Project Alpha", status: "active", priority: "normal", updated_at: now },
      ],
    });
    mockProjectsListTasks.mockResolvedValue([{ id: "task1", project_id: "p1", title: "Task 1" }]);
    mockProjectsListTaskComments.mockResolvedValue([
      { id: "c1", task_id: "task1", created_at: now },
    ]);
    mockProjectsListReadStates.mockResolvedValue([{ task_id: "task1", last_seen_at: oldDate }]);

    const { default: PortalProjectsPage } = await import("@/app/(portal)/portal/projects/page");
    const element = await PortalProjectsPage();
    render(element);

    expect(screen.getByText(/Unread 1/)).toBeInTheDocument();
  });

  it("renders project description", async () => {
    mockProjectsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          name: "Project Alpha",
          status: "active",
          priority: "normal",
          description: "Build new portal",
          updated_at: new Date().toISOString(),
        },
      ],
    });

    const { default: PortalProjectsPage } = await import("@/app/(portal)/portal/projects/page");
    const element = await PortalProjectsPage();
    render(element);

    expect(screen.getByText("Build new portal")).toBeInTheDocument();
  });

  it("renders project link with correct href", async () => {
    mockProjectsList.mockResolvedValue({
      items: [
        {
          id: "p1",
          name: "Project Alpha",
          status: "active",
          priority: "normal",
          updated_at: new Date().toISOString(),
        },
      ],
    });

    const { default: PortalProjectsPage } = await import("@/app/(portal)/portal/projects/page");
    const element = await PortalProjectsPage();
    render(element);

    const link = screen.getByText("Project Alpha").closest("a");
    expect(link).toHaveAttribute("href", "/portal/projects/p1");
  });
});
