import pino from "pino";
import { env } from "../env";
import type { TaskHandler, TaskResult } from "../task-registry";

const logger = pino({ level: env.LOG_LEVEL });

interface JiraSyncPayload {
  projectId?: string;
  organizationId?: string;
  batchSize?: number;
}

interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    description?: string;
    issuetype?: { name: string };
    priority?: { name: string };
    assignee?: { emailAddress?: string; accountId?: string; displayName?: string };
    labels?: string[];
    duedate?: string;
    parent?: { key: string };
    resolution?: { name: string };
    customfield_10007?: string;
    updated: string;
  };
}

const STATUS_MAP: Record<string, string> = {
  "To Do": "todo",
  "In Progress": "in_progress",
  "Under Review": "in_review",
  "Code Review": "in_review",
  "Done": "done",
  "Blocked": "blocked",
};

const PRIORITY_MAP: Record<string, string> = {
  "Highest": "urgent",
  "High": "high",
  "Medium": "normal",
  "Low": "low",
  "Lowest": "low",
};

async function fetchJiraIssue(
  baseUrl: string,
  authHeader: string,
  issueKey: string,
  retries = 2,
): Promise<JiraIssue | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `${baseUrl}/rest/api/3/issue/${issueKey}?fields=summary,status,description,issuetype,priority,assignee,labels,duedate,parent,resolution,customfield_10007,updated`,
        { headers: { Authorization: authHeader, Accept: "application/json" } },
      );
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("retry-after") ?? "5", 10);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!res.ok) return null;
      return (await res.json()) as JiraIssue;
    } catch {
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

export const jiraSync: TaskHandler = async (payload): Promise<TaskResult> => {
  const { projectId, batchSize = 50 } = payload as JiraSyncPayload;
  const baseUrl = env.JIRA_BASE_URL;
  const email = env.JIRA_EMAIL;
  const apiToken = env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    return { ok: false, error: "JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN not configured" };
  }

  logger.info({ projectId, batchSize }, "Starting Jira sync");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      env.SUPABASE_URL ?? "",
      env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY ?? "",
    );

    let query = supabase
      .from("project_tasks")
      .select("id, project_id, title, description, status, external_jira_issue_key, priority, owner_id, due_at")
      .not("external_jira_issue_key", "is", null)
      .limit(batchSize);

    if (projectId) query = query.eq("project_id", projectId);

    const { data: tasks, error: tasksError } = await query;
    if (tasksError) return { ok: false, error: `Failed to fetch tasks: ${tasksError.message}` };

    const authHeader = "Basic " + Buffer.from(`${email}:${apiToken}`).toString("base64");

    let synced = 0;
    let updated = 0;
    let errors = 0;

    for (const task of tasks ?? []) {
      if (!task.external_jira_issue_key) continue;

      const issue = await fetchJiraIssue(baseUrl, authHeader, task.external_jira_issue_key);
      if (!issue) { errors++; continue; }

      const newStatus = STATUS_MAP[issue.fields.status.name] ?? task.status;
      const newPriority = PRIORITY_MAP[issue.fields.priority?.name ?? ""] ?? task.priority;
      const newTitle = issue.fields.summary ?? task.title;
      const newDescription = issue.fields.description ?? task.description;
      const newDueAt = issue.fields.duedate ? new Date(issue.fields.duedate).toISOString() : null;

      const updateData: Record<string, unknown> = {
        jira_last_synced_at: new Date().toISOString(),
      };
      let needsUpdate = false;

      if (newStatus !== task.status) { updateData.status = newStatus; needsUpdate = true; }
      if (newPriority !== task.priority) { updateData.priority = newPriority; needsUpdate = true; }
      if (newTitle !== task.title) { updateData.title = newTitle; needsUpdate = true; }
      if (newDescription !== task.description) { updateData.description = newDescription; needsUpdate = true; }
      if (newDueAt && newDueAt !== task.due_at) { updateData.due_at = newDueAt; needsUpdate = true; }
      if (issue.fields.issuetype?.name) { updateData.issue_type = issue.fields.issuetype.name; needsUpdate = true; }
      if (issue.fields.labels?.length) { updateData.labels = issue.fields.labels; needsUpdate = true; }
      if (issue.fields.resolution?.name) { updateData.resolution = issue.fields.resolution.name; needsUpdate = true; }
      if (issue.fields.parent?.key) { updateData.epic_key = issue.fields.parent.key; needsUpdate = true; }
      if (issue.fields.customfield_10007) { updateData.sprint = issue.fields.customfield_10007; needsUpdate = true; }

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from("project_tasks")
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq("id", task.id);

        if (updateError) {
          errors++;
          logger.warn({ taskId: task.id, error: updateError.message }, "Failed to update task from Jira");
        } else {
          updated++;
          logger.info({ taskId: task.id, issueKey: task.external_jira_issue_key, fields: Object.keys(updateData) }, "Task synced from Jira");
        }
      }

      synced++;
    }

    logger.info({ synced, updated, errors, total: (tasks ?? []).length }, "Jira sync complete");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Jira sync failed");
    return { ok: false, error: msg };
  }
};
