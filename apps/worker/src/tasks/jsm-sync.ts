import pino from "pino";
import { env } from "../env";
import type { TaskHandler, TaskResult } from "../task-registry";

const logger = pino({ level: env.LOG_LEVEL });

interface JsmSyncPayload {
  organizationId?: string;
  projectKey?: string;
  fullSync?: boolean;
}

const STATUS_MAP: Record<string, string> = {
  "Open": "new",
  "In Progress": "in_progress",
  "Waiting for Customer": "waiting_on_client",
  "Waiting for Support": "in_progress",
  "Resolved": "resolved",
  "Closed": "closed",
};

const PRIORITY_MAP: Record<string, string> = {
  "Highest": "urgent",
  "High": "high",
  "Medium": "normal",
  "Low": "low",
  "Lowest": "low",
};

export const jsmSync: TaskHandler = async (payload): Promise<TaskResult> => {
  const { organizationId, projectKey, fullSync } = payload as JsmSyncPayload;
  const baseUrl = env.JSM_BASE_URL;
  const email = env.JSM_EMAIL;
  const apiToken = env.JSM_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    return { ok: false, error: "JSM_BASE_URL, JSM_EMAIL, JSM_API_TOKEN not configured" };
  }

  logger.info({ organizationId, projectKey, fullSync }, "Starting JSM sync");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      env.SUPABASE_URL ?? "",
      env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY ?? "",
    );

    const authHeader = "Basic " + Buffer.from(`${email}:${apiToken}`).toString("base64");
    const headers = { Authorization: authHeader, "Content-Type": "application/json", Accept: "application/json" };

    const daysBack = fullSync ? 30 : 7;
    const jql = `project = ${projectKey ?? "MCT"} AND created >= -${daysBack}d ORDER BY created DESC`;
    const res = await fetch(
      `${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,issuetype,priority,labels,resolution,assignee,updated`,
      { headers },
    );

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `JSM API error ${res.status}: ${text}` };
    }

    const data = await res.json() as {
      issues: Array<{
        key: string;
        fields: {
          summary: string;
          status: { name: string };
          issuetype: { name: string };
          priority?: { name: string };
          labels?: string[];
          resolution?: { name: string };
          assignee?: { emailAddress?: string; displayName?: string };
          updated: string;
        };
      }>;
    };

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const issue of data.issues) {
      const { data: existing } = await supabase
        .from("tickets")
        .select("id, status, priority, title")
        .eq("external_jsm_issue_key", issue.key)
        .maybeSingle();

      const newStatus = STATUS_MAP[issue.fields.status.name] ?? "new";
      const newPriority = PRIORITY_MAP[issue.fields.priority?.name ?? ""] ?? "normal";
      const newLabels = issue.fields.labels ?? [];
      const newResolution = issue.fields.resolution?.name ?? null;

      if (existing) {
        const updateData: Record<string, unknown> = {
          jira_last_synced_at: new Date().toISOString(),
        };
        let needsUpdate = false;

        if (newStatus !== existing.status) { updateData.status = newStatus; needsUpdate = true; }
        if (newPriority !== existing.priority) { updateData.priority = newPriority; needsUpdate = true; }
        if (newLabels.length) { updateData.labels = newLabels; needsUpdate = true; }
        if (newResolution) { updateData.resolution = newResolution; needsUpdate = true; }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from("tickets")
            .update(updateData)
            .eq("id", existing.id);

          if (updateError) {
            logger.warn({ ticketId: existing.id, issueKey: issue.key, error: updateError.message }, "Failed to update ticket from JSM");
          } else {
            updated++;
            logger.info({ issueKey: issue.key, fields: Object.keys(updateData) }, "Ticket synced from JSM");
          }
        } else {
          skipped++;
        }
      } else {
        await supabase.from("tickets").insert({
          organization_id: organizationId,
          title: issue.fields.summary,
          description: `Imported from JSM ${issue.key}`,
          status: newStatus,
          priority: newPriority,
          category: issue.fields.issuetype.name,
          source: "jsm",
          external_jsm_issue_key: issue.key,
          labels: newLabels.length ? newLabels : null,
          resolution: newResolution,
          jira_last_synced_at: new Date().toISOString(),
        });
        created++;
      }
    }

    logger.info({ created, updated, skipped, total: data.issues.length }, "JSM sync complete");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "JSM sync failed");
    return { ok: false, error: msg };
  }
};
