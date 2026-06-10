import { ApiClient } from "./client";
import type {
  Project,
  ProjectTask,
  ProjectUpdate,
  ProjectTaskComment,
  ProjectTaskReadState,
  ProjectDetail,
  PaginatedResult,
} from "./types";

export class ProjectsApi {
  constructor(private client: ApiClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    organizationId?: string;
    status?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    return this.client.get<PaginatedResult<Project>>("/api/v1/projects", qp);
  }

  get(id: string) {
    return this.client.get<Project>(`/api/v1/projects/${id}`);
  }

  getDetail(id: string) {
    return this.client.get<ProjectDetail>(`/api/v1/projects/${id}/detail`);
  }

  create(data: {
    organizationId: string;
    name: string;
    description?: string | null;
    status?: string;
    priority?: string;
    startsAt?: string | null;
    dueAt?: string | null;
    externalJiraProjectKey?: string | null;
  }) {
    return this.client.post<Project>("/api/v1/projects", data);
  }

  update(
    id: string,
    data: {
      name?: string;
      description?: string | null;
      status?: string;
      priority?: string;
      startsAt?: string | null;
      dueAt?: string | null;
      externalJiraProjectKey?: string | null;
    },
  ) {
    return this.client.patch<Project>(`/api/v1/projects/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/projects/${id}`);
  }

  listTasks(projectId: string) {
    return this.client.get<ProjectTask[]>(
      `/api/v1/projects/${projectId}/tasks`,
    );
  }

  addTask(
    projectId: string,
    data: {
      title: string;
      description?: string | null;
      details?: string | null;
      status?: string;
      sortOrder?: number;
      dueAt?: string | null;
      approvalRequired?: boolean;
      ownerId?: string | null;
      externalJiraIssueKey?: string | null;
      issueType?: string | null;
      priority?: string | null;
      labels?: string[] | null;
      parentTaskId?: string | null;
      epicKey?: string | null;
      resolution?: string | null;
      sprint?: string | null;
    },
  ) {
    return this.client.post<ProjectTask>(
      `/api/v1/projects/${projectId}/tasks`,
      data,
    );
  }

  updateTask(
    projectId: string,
    taskId: string,
    data: {
      title?: string;
      description?: string | null;
      details?: string | null;
      status?: string;
      sortOrder?: number;
      dueAt?: string | null;
      approvalRequired?: boolean;
      ownerId?: string | null;
      approvedBy?: string | null;
      approvedAt?: string | null;
      externalJiraIssueKey?: string | null;
      issueType?: string | null;
      priority?: string | null;
      labels?: string[] | null;
      parentTaskId?: string | null;
      epicKey?: string | null;
      resolution?: string | null;
      sprint?: string | null;
    },
  ) {
    return this.client.patch<ProjectTask>(
      `/api/v1/projects/${projectId}/tasks/${taskId}`,
      data,
    );
  }

  removeTask(projectId: string, taskId: string) {
    return this.client.delete<void>(
      `/api/v1/projects/${projectId}/tasks/${taskId}`,
    );
  }

  addTaskComment(
    projectId: string,
    taskId: string,
    data: { body: string; isInternal?: boolean },
  ) {
    return this.client.post<ProjectTaskComment>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
      data,
    );
  }

  updateTaskComment(
    projectId: string,
    taskId: string,
    commentId: string,
    data: { body?: string; isInternal?: boolean },
  ) {
    return this.client.patch<ProjectTaskComment>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
      data,
    );
  }

  removeTaskComment(projectId: string, taskId: string, commentId: string) {
    return this.client.delete<void>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    );
  }

  listTaskComments(
    projectId: string,
    params?: {
      organizationId?: string;
      isInternal?: boolean;
      taskIds?: string[];
    },
  ) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.isInternal !== undefined)
      qp.is_internal = String(params.isInternal);
    if (params?.taskIds?.length) qp.task_ids = params.taskIds.join(",");
    return this.client.get<ProjectTaskComment[]>(
      `/api/v1/projects/${projectId}/tasks/comments`,
      qp,
    );
  }

  listReadStates(
    projectId: string,
    params?: { organizationId?: string; taskIds?: string[] },
  ) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.taskIds?.length) qp.task_ids = params.taskIds.join(",");
    return this.client.get<ProjectTaskReadState[]>(
      `/api/v1/projects/${projectId}/tasks/read-states`,
      qp,
    );
  }

  reorderTasks(projectId: string, data: { order: string[] }) {
    return this.client.post<{ reordered: number }>(
      `/api/v1/projects/${projectId}/tasks/reorder`,
      data,
    );
  }

  markTaskRead(
    projectId: string,
    taskId: string,
    data: { organizationId: string },
  ) {
    return this.client.post<{ marked: boolean }>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/read`,
      data,
    );
  }

  approveTask(
    projectId: string,
    taskId: string,
    data: { organizationId: string },
  ) {
    return this.client.post<{ approved: boolean }>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/approve`,
      data,
    );
  }

  addPortalTaskComment(
    projectId: string,
    taskId: string,
    data: { organizationId: string; body: string },
  ) {
    return this.client.post<{ added: boolean }>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/portal-comment`,
      data,
    );
  }

  exportData(params?: {
    format?: "csv" | "json";
    organizationId?: string;
    status?: string;
  }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.format) qp.format = params.format;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    return this.client.get<Blob>(`/api/v1/projects/export`, qp);
  }

  listUpdates(projectId: string) {
    return this.client.get<ProjectUpdate[]>(
      `/api/v1/projects/${projectId}/updates`,
    );
  }

  addUpdate(
    projectId: string,
    data: { body: string; isInternal?: boolean; isPinned?: boolean },
  ) {
    return this.client.post<ProjectUpdate>(
      `/api/v1/projects/${projectId}/updates`,
      data,
    );
  }

  updateUpdate(
    projectId: string,
    updateId: string,
    data: {
      body?: string;
      isInternal?: boolean;
      isPinned?: boolean;
    },
  ) {
    return this.client.patch<ProjectUpdate>(
      `/api/v1/projects/${projectId}/updates/${updateId}`,
      data,
    );
  }

  removeUpdate(projectId: string, updateId: string) {
    return this.client.delete<void>(
      `/api/v1/projects/${projectId}/updates/${updateId}`,
    );
  }
}
