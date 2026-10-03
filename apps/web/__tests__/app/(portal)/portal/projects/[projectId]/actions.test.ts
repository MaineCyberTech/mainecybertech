import { jest } from "@jest/globals";

const mockProjectsAddUpdate = jest.fn();
const mockProjectsApproveTask = jest.fn();
const mockProjectsAddPortalTaskComment = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  projects: {
    addUpdate: mockProjectsAddUpdate,
    approveTask: mockProjectsApproveTask,
    addPortalTaskComment: mockProjectsAddPortalTaskComment,
  },
});
const mockGetApprovedMembership = jest.fn();
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("@/lib/auth/membership", () => ({
  getApprovedMembership: mockGetApprovedMembership,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("addPortalProjectUpdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds an update successfully", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalProjectUpdate } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("projectId", "project-1");
    formData.set("body", "Progress update");

    await addPortalProjectUpdate(formData);

    expect(mockProjectsAddUpdate).toHaveBeenCalledWith("project-1", {
      body: "Progress update",
      isInternal: false,
      isPinned: false,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/projects/project-1");
  });

  it("returns error when projectId is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalProjectUpdate } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("body", "Update");

    const result = await addPortalProjectUpdate(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Project ID and update body");
    expect(mockProjectsAddUpdate).not.toHaveBeenCalled();
  });

  it("returns error when body is empty", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalProjectUpdate } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("projectId", "project-1");
    formData.set("body", "");

    const result = await addPortalProjectUpdate(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Project ID and update body");
    expect(mockProjectsAddUpdate).not.toHaveBeenCalled();
  });

  it("returns error when no approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { addPortalProjectUpdate } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("projectId", "project-1");
    formData.set("body", "Update");

    const result = await addPortalProjectUpdate(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("No approved organization membership found");
    expect(mockProjectsAddUpdate).not.toHaveBeenCalled();
  });
});

describe("approvePortalProjectTask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("approves a task successfully", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { approvePortalProjectTask } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("taskId", "task-1");
    formData.set("projectId", "project-1");

    await approvePortalProjectTask(formData);

    expect(mockProjectsApproveTask).toHaveBeenCalledWith("project-1", "task-1", {
      organizationId: "org-1",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/projects/project-1");
  });

  it("returns error when taskId is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { approvePortalProjectTask } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("projectId", "project-1");

    const result = await approvePortalProjectTask(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Project ID and task ID");
    expect(mockProjectsApproveTask).not.toHaveBeenCalled();
  });

  it("returns error when projectId is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { approvePortalProjectTask } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("taskId", "task-1");

    const result = await approvePortalProjectTask(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Project ID and task ID");
    expect(mockProjectsApproveTask).not.toHaveBeenCalled();
  });

  it("returns error when no approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { approvePortalProjectTask } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("taskId", "task-1");
    formData.set("projectId", "project-1");

    const result = await approvePortalProjectTask(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("No approved organization membership found");
    expect(mockProjectsApproveTask).not.toHaveBeenCalled();
  });
});

describe("addPortalTaskComment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds a task comment successfully", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTaskComment } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("taskId", "task-1");
    formData.set("projectId", "project-1");
    formData.set("body", "Looks good!");

    await addPortalTaskComment(formData);

    expect(mockProjectsAddPortalTaskComment).toHaveBeenCalledWith("project-1", "task-1", {
      organizationId: "org-1",
      body: "Looks good!",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/projects/project-1");
  });

  it("returns error when taskId is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTaskComment } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("projectId", "project-1");
    formData.set("body", "Nice");

    const result = await addPortalTaskComment(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Project ID, task ID, and comment body");
    expect(mockProjectsAddPortalTaskComment).not.toHaveBeenCalled();
  });

  it("returns error when body is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTaskComment } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("taskId", "task-1");
    formData.set("projectId", "project-1");

    const result = await addPortalTaskComment(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Project ID, task ID, and comment body");
    expect(mockProjectsAddPortalTaskComment).not.toHaveBeenCalled();
  });

  it("returns error when projectId is missing", async () => {
    mockGetApprovedMembership.mockResolvedValue({ organization_id: "org-1" });

    const { addPortalTaskComment } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("taskId", "task-1");
    formData.set("body", "Comment");

    const result = await addPortalTaskComment(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Project ID, task ID, and comment body");
  });

  it("returns error when no approved membership", async () => {
    mockGetApprovedMembership.mockResolvedValue(null);

    const { addPortalTaskComment } =
      await import("@/app/(portal)/portal/projects/[projectId]/actions");

    const formData = new FormData();
    formData.set("taskId", "task-1");
    formData.set("projectId", "project-1");
    formData.set("body", "Comment");

    const result = await addPortalTaskComment(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("No approved organization membership found");
    expect(mockProjectsAddPortalTaskComment).not.toHaveBeenCalled();
  });
});
