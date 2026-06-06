import pino from "pino";
import { env } from "../main";
import type { TaskHandler, TaskResult } from "../main";

const logger = pino({ level: env.LOG_LEVEL });

interface CalendarSyncPayload {
  projectId?: string;
  organizationId?: string;
}

export const m365CalendarSync: TaskHandler = async (payload): Promise<TaskResult> => {
  const { projectId, organizationId } = payload as CalendarSyncPayload;
  const tenantId = env.M365_TENANT_ID;
  const clientId = env.M365_CLIENT_ID;
  const clientSecret = env.M365_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    return { ok: false, error: "M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET not configured" };
  }

  logger.info({ projectId, organizationId }, "Starting M365 calendar sync");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      env.SUPABASE_URL ?? "",
      env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY ?? "",
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
      },
    );

    if (!tokenRes.ok) {
      return { ok: false, error: `M365 token error: ${tokenRes.status}` };
    }

    const { access_token } = await tokenRes.json() as { access_token: string };

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

      const eventRes = await fetch("https://graph.microsoft.com/v1.0/me/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      if (eventRes.ok) synced++;
    }

    logger.info({ synced, total: (tasks ?? []).length }, "M365 calendar sync complete");
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "M365 calendar sync failed");
    return { ok: false, error: msg };
  }
};
