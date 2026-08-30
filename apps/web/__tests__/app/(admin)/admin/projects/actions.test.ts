import { jest } from "@jest/globals";

const mockProjectsCreate = jest.fn();
const mockGetApiClient = jest.fn().mockReturnValue({
  projects: { create: mockProjectsCreate },
});
const mockRevalidatePath = jest.fn();

jest.mock("@/lib/api", () => ({
  getApiClient: mockGetApiClient,
}));

jest.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

describe("createProject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a project with all fields", async () => {
    const { createProject } = await import("@/app/(admin)/admin/projects/actions");

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("name", "Website Redesign");
    formData.set("description", "Full redesign");
    formData.set("status", "active");
    formData.set("priority", "high");
    formData.set("startsAt", "2026-06-01");
    formData.set("dueAt", "2026-09-01");

    await createProject(formData);

    expect(mockProjectsCreate).toHaveBeenCalledWith({
      organizationId: "org-1",
      name: "Website Redesign",
      description: "Full redesign",
      status: "active",
      priority: "high",
      startsAt: "2026-06-01",
      dueAt: "2026-09-01",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/projects");
  });

  it("uses default values when optional fields not provided", async () => {
    const { createProject } = await import("@/app/(admin)/admin/projects/actions");

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("name", "Project X");

    await createProject(formData);

    expect(mockProjectsCreate).toHaveBeenCalledWith({
      organizationId: "org-1",
      name: "Project X",
      description: null,
      status: "planned",
      priority: "normal",
      startsAt: null,
      dueAt: null,
    });
  });

  it("returns error when organizationId is missing", async () => {
    const { createProject } = await import("@/app/(admin)/admin/projects/actions");

    const formData = new FormData();
    formData.set("name", "Project X");

    const result = await createProject(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Organization and project name");
    expect(mockProjectsCreate).not.toHaveBeenCalled();
  });

  it("returns error when name is missing", async () => {
    const { createProject } = await import("@/app/(admin)/admin/projects/actions");

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("name", "");

    const result = await createProject(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Organization and project name");
    expect(mockProjectsCreate).not.toHaveBeenCalled();
  });

  it("returns error when name is whitespace only", async () => {
    const { createProject } = await import("@/app/(admin)/admin/projects/actions");

    const formData = new FormData();
    formData.set("organizationId", "org-1");
    formData.set("name", "   ");

    const result = await createProject(formData);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Organization and project name");
    expect(mockProjectsCreate).not.toHaveBeenCalled();
  });
});
