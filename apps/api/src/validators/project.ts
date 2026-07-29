import { z } from "zod";

export const createProjectSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(500),
  description: z.string().max(10000).optional().nullable(),
  status: z
    .enum(["planned", "active", "blocked", "client_review", "completed", "archived"])
    .default("planned"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  startsAt: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  externalJiraProjectKey: z.string().max(50).optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: z
    .enum(["planned", "active", "blocked", "client_review", "completed", "archived"])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  startsAt: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  externalJiraProjectKey: z.string().max(50).optional().nullable(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(10000).optional().nullable(),
  details: z.string().max(50000).optional().nullable(),
  status: z.enum(["todo", "in_progress", "in_review", "blocked", "done"]).default("todo"),
  sortOrder: z.number().int().default(0),
  dueAt: z.string().optional().nullable(),
  approvalRequired: z.boolean().default(false),
  ownerId: z.string().optional().nullable(),
  externalJiraIssueKey: z.string().max(50).optional().nullable(),
  issueType: z.string().max(50).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
  labels: z.array(z.string().max(100)).optional().nullable(),
  parentTaskId: z.string().uuid().optional().nullable(),
  epicKey: z.string().max(50).optional().nullable(),
  resolution: z.string().max(50).optional().nullable(),
  sprint: z.string().max(100).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional().nullable(),
  details: z.string().max(50000).optional().nullable(),
  status: z.enum(["todo", "in_progress", "in_review", "blocked", "done"]).optional(),
  sortOrder: z.number().int().optional(),
  dueAt: z.string().optional().nullable(),
  approvalRequired: z.boolean().optional(),
  ownerId: z.string().optional().nullable(),
  externalJiraIssueKey: z.string().max(50).optional().nullable(),
  issueType: z.string().max(50).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  labels: z.array(z.string().max(100)).optional().nullable(),
  parentTaskId: z.string().uuid().optional().nullable(),
  epicKey: z.string().max(50).optional().nullable(),
  resolution: z.string().max(50).optional().nullable(),
  sprint: z.string().max(100).optional().nullable(),
  approvedBy: z.string().optional().nullable(),
  approvedAt: z.string().optional().nullable(),
});

export const addTaskCommentSchema = z.object({
  body: z.string().min(1, "Comment body is required").max(10000),
  isInternal: z.boolean().default(false),
});

export const updateTaskCommentSchema = z.object({
  body: z.string().min(1).max(10000).optional(),
  isInternal: z.boolean().optional(),
});

export const reorderTasksSchema = z.object({
  order: z.array(z.string().uuid()).min(1),
});

export const markTaskReadSchema = z.object({
  organizationId: z.string().uuid(),
});

export const approveTaskSchema = z.object({
  organizationId: z.string().uuid(),
});

export const portalTaskCommentSchema = z.object({
  organizationId: z.string().uuid(),
  body: z.string().min(1, "Comment body is required").max(10000),
});

export const addProjectUpdateSchema = z.object({
  body: z.string().min(1, "Update body is required").max(50000),
  isInternal: z.boolean().default(false),
  isPinned: z.boolean().default(false),
});

export const updateProjectUpdateSchema = z.object({
  body: z.string().min(1).max(50000).optional(),
  isInternal: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

export const createPhaseSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z.string().default("planned"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const updatePhaseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const createMilestoneSchema = z.object({
  projectId: z.string().uuid(),
  phaseId: z.string().optional().nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.string().default("pending"),
});

export const updateMilestoneSchema = z.object({
  phaseId: z.string().optional().nullable(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  status: z.string().optional(),
  completedAt: z.string().optional().nullable(),
});

export const createDependencySchema = z.object({
  projectId: z.string().uuid(),
  dependsOnTaskId: z.string().optional().nullable(),
  dependsOnMilestoneId: z.string().optional().nullable(),
  blockedByProjectId: z.string().optional().nullable(),
  dependencyType: z.string().default("finish_to_start"),
});

export const updateDependencySchema = z.object({
  dependsOnTaskId: z.string().optional().nullable(),
  dependsOnMilestoneId: z.string().optional().nullable(),
  blockedByProjectId: z.string().optional().nullable(),
  dependencyType: z.string().optional(),
});
