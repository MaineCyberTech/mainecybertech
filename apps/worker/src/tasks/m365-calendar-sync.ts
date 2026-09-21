import { env } from "../env";
import { wsTransport } from "../services/supabase";
import { logger } from "../logger";
import type { TaskHandler, TaskResult } from "../task-registry";

interface CalendarSyncPayload {
  projectId?: string;
  organizationId?: string;
  /** Mailbox to write events to; app-only tokens cannot use /me. */
  userPrincipalName?: string;
}

export const m365CalendarSync: TaskHandler = async (payload): Promise<TaskResult> => {
  const { projectId, organizationId, userPrincipalName } = payload as CalendarSyncPayload;
  const tenantId = env.M365_TENANT_ID;
  const clientId = env.M365_CLIENT_ID;
  const clientSecret = env.M365_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    return {
      ok: false,
      error: "M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET not configured",
    };
  }

  if (!projectId || !userPrincipalName) {
    return {
      ok: false,
      error: "projectId and userPrincipalName are required (app-only tokens cannot use /me)",
    };
  }

  logger.info({ projectId, organizationId, userPrincipalName }, "Starting M365 calendar sync");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      env.SUPABASE_URL ?? "",
      env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY ?? "",
      { realtime: { transport: wsTransport } },
    );

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!tokenRes.ok) {
      return { ok: false, error: `M365 token error: ${tokenRes.status}` };
    }

    const { access_token } = (await tokenRes.json()) as { access_token: string };

    const { data: tasks, error: tasksError } = await supabase
      .from("project_tasks")
      .select("id, title, due_at")
      .eq("project_id", projectId)
      .not("due_at", "is", null)
      .limit(200);

    if (tasksError) {
      return { ok: false, error: `Failed to fetch tasks: ${tasksError.message}` };
    }

    let synced = 0;
    let errors = 0;

    for (const task of tasks ?? []) {
      if (!task.due_at) continue;

      const dueDate = new Date(task.due_at);
      const startDate = new Date(dueDate.getTime() - 60 * 60 * 1000);

      const event = {
        subject: `Task Due: ${task.title}`,
        start: { dateTime: startDate.toISOString(), timeZone: "UTC" },
        end: { dateTime: dueDate.toISOString(), timeZone: "UTC" },
        isReminderOn: true,
        reminderMinutesBeforeStart: 30,
      };

      const eventRes = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(userPrincipalName)}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (eventRes.ok) {
        synced++;
      } else {
        errors++;
        logger.warn({ status: eventRes.status, taskId: task.id }, "M365 event create failed");
      }
    }

    logger.info({ synced, errors, total: (tasks ?? []).length }, "M365 calendar sync complete");
    return errors > 0 ? { ok: false, error: `${errors} event(s) failed to sync` } : { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "M365 calendar sync failed");
    return { ok: false, error: msg };
  }
};
