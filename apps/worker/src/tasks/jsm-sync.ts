import { env } from "../env";
import { wsTransport } from "../services/supabase";
import { logger } from "../logger";
import type { TaskHandler, TaskResult } from "../task-registry";

interface JsmSyncPayload {
  organizationId?: string;
  projectKey?: string;
  fullSync?: boolean;
}

const STATUS_MAP: Record<string, string> = {
  Open: "new",
  "In Progress": "in_progress",
  "Waiting for Customer": "waiting_on_client",
  "Waiting for Support": "in_progress",
  Resolved: "resolved",
  Closed: "closed",
};

const PRIORITY_MAP: Record<string, string> = {
  Highest: "urgent",
  High: "high",
  Medium: "normal",
  Low: "low",
  Lowest: "low",
};

// API-P2-002: paginate the JSM search (previously a single maxResults=100 page
// silently dropped every later issue) and retry transient HTTP failures.
const PAGE_SIZE = 100;
const MAX_PAGES = 20; // 2000 issues per run; truncation is reported, not silent
const FETCH_ATTEMPTS = 3;
const RETRY_BASE_MS = 500;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with bounded retry for transient failures (network errors, 429, 5xx).
 * The final response is returned as-is so the caller keeps its error handling.
 */
async function jsmFetch(url: string, headers: Record<string, string>): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
      if ((res.status === 429 || res.status >= 500) && attempt < FETCH_ATTEMPTS) {
        lastError = new Error(`JSM API error ${res.status}`);
        await sleep(RETRY_BASE_MS * attempt);
        continue;
      }
      return res;
    } catch (error) {
      lastError = error;
      if (attempt < FETCH_ATTEMPTS) {
        await sleep(RETRY_BASE_MS * attempt);
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

type JsmIssue = {
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
};

export const jsmSync: TaskHandler = async (payload): Promise<TaskResult> => {
  const { organizationId, projectKey, fullSync } = payload as JsmSyncPayload;
  if (!organizationId) {
    return { ok: false, error: "organizationId is required" };
  }
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
      { realtime: { transport: wsTransport } },
    );

    const authHeader = "Basic " + Buffer.from(`${email}:${apiToken}`).toString("base64");
    const headers = {
      Authorization: authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const daysBack = fullSync ? 30 : 7;
    const jql = `project = ${projectKey ?? "MCT"} AND created >= -${daysBack}d ORDER BY created DESC`;

    const issues: JsmIssue[] = [];
    let startAt = 0;
    let truncated = false;
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await jsmFetch(
        `${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${PAGE_SIZE}&fields=summary,status,issuetype,priority,labels,resolution,assignee,updated`,
        headers,
      );

      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `JSM API error ${res.status}: ${text}` };
      }

      const data = (await res.json()) as { issues?: JsmIssue[]; total?: number };
      const pageIssues = data.issues ?? [];
      issues.push(...pageIssues);
      startAt += pageIssues.length;

      if (pageIssues.length === 0) break;
      if (typeof data.total === "number" && startAt >= data.total) break;
      if (pageIssues.length < PAGE_SIZE) break;
      if (page === MAX_PAGES - 1) truncated = true;
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const issue of issues) {
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

        if (newStatus !== existing.status) {
          updateData.status = newStatus;
          needsUpdate = true;
        }
        if (newPriority !== existing.priority) {
          updateData.priority = newPriority;
          needsUpdate = true;
        }
        if (newLabels.length) {
          updateData.labels = newLabels;
          needsUpdate = true;
        }
        if (newResolution) {
          updateData.resolution = newResolution;
          needsUpdate = true;
        }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from("tickets")
            .update(updateData)
            .eq("id", existing.id);

          if (updateError) {
            // API-P2-002: a dropped update must fail the run, not just log.
            errors++;
            logger.error(
              { ticketId: existing.id, issueKey: issue.key, error: updateError.message },
              "Failed to update ticket from JSM",
            );
          } else {
            updated++;
            logger.info(
              { issueKey: issue.key, fields: Object.keys(updateData) },
              "Ticket synced from JSM",
            );
          }
        } else {
          skipped++;
        }
      } else {
        const { error: insertError } = await supabase.from("tickets").insert({
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
        if (insertError) {
          // Do not report success for rows that were not written.
          errors++;
          logger.error({ error: insertError.message, key: issue.key }, "JSM ticket insert failed");
          continue;
        }
        created++;
      }
    }

    logger.info(
      { created, updated, skipped, errors, total: issues.length },
      "JSM sync complete",
    );
    if (truncated) {
      // Do not report success for a sync that stopped at the page cap.
      return {
        ok: false,
        error: `JSM sync truncated after ${issues.length} issues (page cap ${MAX_PAGES}); rerun with a narrower window`,
      };
    }
    return errors > 0 ? { ok: false, error: `${errors} ticket(s) failed to import` } : { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "JSM sync failed");
    return { ok: false, error: msg };
  }
};
