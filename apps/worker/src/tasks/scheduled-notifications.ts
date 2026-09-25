import { env } from "../env";
import { wsTransport } from "../services/supabase";
import { logger } from "../logger";
import { sendEmail } from "../email";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskHandler, TaskResult } from "../task-registry";

interface NotificationPayload {
  type?: "task-due" | "membership-approved" | "ticket-responded" | "custom";
  targetUserId?: string;
  organizationId?: string;
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

/** Escape user-controlled content before interpolating it into email HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function createInAppNotification(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  module: string,
  moduleId?: string,
  action: string = "updated",
) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      title,
      body,
      module,
      module_id: moduleId,
      action,
    });
  } catch (error) {
    logger.warn({ error: String(error), userId, title }, "Failed to create in-app notification");
  }
}

/**
 * True when the same notification was created very recently — guards against
 * duplicate emails/notifications when a job is retried (BullMQ attempts/SQS
 * redelivery). The window is short so genuine repeat events still notify.
 */
async function recentlyNotified(
  supabase: SupabaseClient,
  userId: string,
  module: string,
  moduleId: string | null,
  action: string,
  windowMinutes = 10,
): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  let query = supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("module", module)
    .eq("action", action)
    .gte("created_at", since);
  query = moduleId ? query.eq("module_id", moduleId) : query.is("module_id", null);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export const scheduledNotifications: TaskHandler = async (payload): Promise<TaskResult> => {
  const p = payload as NotificationPayload;

  logger.info({ type: p.type, targetUserId: p.targetUserId }, "Processing notification");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      env.SUPABASE_URL ?? "",
      env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY ?? "",
      { realtime: { transport: wsTransport } },
    );

    switch (p.type) {
      case "task-due": {
        const appBaseUrl = env.APP_BASE_URL ?? env.API_BASE_URL ?? "";
        const dueBefore = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { data: tasks } = await supabase
          .from("project_tasks")
          .select("id, title, due_at, owner_id, project_id, projects(name)")
          .not("due_at", "is", null)
          .lte("due_at", dueBefore)
          .neq("status", "done")
          .not("owner_id", "is", null)
          .limit(100);

        let notified = 0;
        let emailed = 0;

        // Batch the profile + dedupe lookups (previously 2 queries per task).
        const ownerIds = Array.from(
          new Set((tasks ?? []).map((t) => t.owner_id).filter((id): id is string => Boolean(id))),
        );
        const profileById = new Map<string, { email: string | null; full_name: string | null }>();
        const alerted = new Set<string>();

        if (ownerIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .in("id", ownerIds);
          for (const profile of profiles ?? []) {
            profileById.set(profile.id as string, {
              email: (profile.email as string) ?? null,
              full_name: (profile.full_name as string) ?? null,
            });
          }

          const { data: existing } = await supabase
            .from("notifications")
            .select("user_id, module_id, action")
            .eq("module", "projects")
            .in("user_id", ownerIds)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
          for (const row of existing ?? []) {
            alerted.add(`${row.user_id}|${row.module_id}|${row.action}`);
          }
        }

        for (const task of tasks ?? []) {
          if (!task.owner_id) continue;

          const profile = profileById.get(task.owner_id);
          if (!profile?.email) continue;

          const isOverdue = task.due_at && new Date(task.due_at) < new Date();
          const action = isOverdue ? "overdue" : "due_soon";
          const title = isOverdue ? "Task Overdue" : "Task Due Soon";
          const projName = Array.isArray(task.projects)
            ? (task.projects as Array<{ name: string }>)[0]?.name
            : ((task.projects as { name: string } | null)?.name ?? null);
          const body = `"${task.title}"${isOverdue ? " is overdue" : " is due within 24 hours"}${projName ? ` in project ${projName}` : ""}.`;
          const link = `${appBaseUrl}/portal/projects/${task.project_id}`;

          // Dedupe: the scan runs daily and a task can stay overdue for days,
          // so do not re-notify/re-email the same task within a week.
          if (alerted.has(`${task.owner_id}|${task.id}|${action}`)) continue;

          await createInAppNotification(
            supabase,
            task.owner_id,
            title,
            body,
            "projects",
            task.id,
            action,
          );

          const emailSent = await sendEmail({
            to: profile.email,
            subject: `[Maine CyberTech] ${title}: ${task.title}`,
            text: `Hello ${profile.full_name ?? "there"},\n\n${body}\n\nView your project: ${link}`,
            html: `<p>Hello ${escapeHtml(profile.full_name ?? "there")},</p><p>${escapeHtml(body)}</p><p><a href="${link}">View project</a></p>`,
          });
          if (emailSent) emailed++;

          notified++;
        }

        logger.info(
          { notified, emailed, total: (tasks ?? []).length },
          "Task-due notifications processed",
        );
        return { ok: true };
      }

      case "membership-approved": {
        if (!p.targetUserId) return { ok: false, error: "targetUserId required" };

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", p.targetUserId)
          .single();

        if (!profile?.email) return { ok: false, error: "User profile not found" };

        if (await recentlyNotified(supabase, p.targetUserId, "system", null, "created")) {
          return { ok: true };
        }

        await createInAppNotification(
          supabase,
          p.targetUserId,
          "Membership Approved",
          "Your organization membership has been approved.",
          "system",
          undefined,
          "created",
        );

        logger.info({ userId: p.targetUserId }, "Membership approved notification sent");
        return { ok: true };
      }

      case "ticket-responded": {
        if (!p.targetUserId) return { ok: false, error: "targetUserId required" };

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", p.targetUserId)
          .single();

        if (!profile?.email) return { ok: false, error: "User profile not found" };

        const ticketId = (p.metadata?.ticketId as string) ?? null;
        if (await recentlyNotified(supabase, p.targetUserId, "tickets", ticketId, "updated")) {
          return { ok: true };
        }

        await createInAppNotification(
          supabase,
          p.targetUserId,
          p.title ?? "Ticket Updated",
          p.body ?? "A ticket has been updated.",
          "tickets",
          (p.metadata?.ticketId as string) ?? undefined,
          "updated",
        );

        const emailSent = await sendEmail({
          to: profile.email,
          subject: `[Maine CyberTech] ${p.title ?? "Ticket Update"}`,
          text: `Hello ${profile.full_name ?? "there"},\n\n${p.body ?? "A ticket has been updated."}\n\nView: ${env.API_BASE_URL ?? ""}/portal/tickets/${p.metadata?.ticketId ?? ""}`,
          html: `<p>Hello ${escapeHtml(profile.full_name ?? "there")},</p><p>${escapeHtml(p.body ?? "A ticket has been updated.")}</p><p><a href="${env.API_BASE_URL ?? ""}/portal/tickets/${p.metadata?.ticketId ?? ""}">View ticket</a></p>`,
        });

        logger.info(
          { userId: p.targetUserId, title: p.title, emailSent },
          "Ticket responded notification sent",
        );
        return { ok: true };
      }

      case "custom": {
        if (!p.targetUserId) return { ok: false, error: "targetUserId required" };
        if (!p.title) return { ok: false, error: "title required for custom notification" };

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", p.targetUserId)
          .single();

        if (!profile?.email) return { ok: false, error: "User profile not found" };

        if (await recentlyNotified(supabase, p.targetUserId, "system", null, "created")) {
          return { ok: true };
        }

        await createInAppNotification(
          supabase,
          p.targetUserId,
          p.title,
          p.body ?? "",
          "system",
          undefined,
          "created",
        );

        const emailSent = await sendEmail({
          to: profile.email,
          subject: `[Maine CyberTech] ${p.title}`,
          text: `Hello ${profile.full_name ?? "there"},\n\n${p.body ?? ""}`,
          html: `<p>Hello ${escapeHtml(profile.full_name ?? "there")},</p><p>${escapeHtml(p.body ?? "")}</p>`,
        });

        logger.info(
          { userId: p.targetUserId, title: p.title, emailSent },
          "Custom notification sent",
        );
        return { ok: true };
      }

      default:
        return { ok: false, error: `Unknown notification type: ${p.type}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Notification task failed");
    return { ok: false, error: msg };
  }
};
