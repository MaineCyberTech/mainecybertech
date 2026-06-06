import pino from "pino";
import { env } from "../main";
import { sendEmail } from "../email";
import type { TaskHandler, TaskResult } from "../main";

const logger = pino({ level: env.LOG_LEVEL });

interface NotificationPayload {
  type?: "task-due" | "membership-approved" | "ticket-responded" | "custom";
  targetUserId?: string;
  organizationId?: string;
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

async function createInAppNotification(supabase: any, userId: string, title: string, body: string, module: string, moduleId?: string, action: string = "updated") {
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

export const scheduledNotifications: TaskHandler = async (payload): Promise<TaskResult> => {
  const p = payload as NotificationPayload;

  logger.info({ type: p.type, targetUserId: p.targetUserId }, "Processing notification");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      env.SUPABASE_URL ?? "",
      env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY ?? "",
    );

    switch (p.type) {
      case "task-due": {
        const { data: tasks } = await supabase
          .from("project_tasks")
          .select("id, title, due_at, owner_id, project_id, projects(name)")
          .not("due_at", "is", null)
          .or(`due_at.lte.${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()},due_at.lte.${new Date().toISOString()}`)
          .not("owner_id", "is", null)
          .limit(100);

        let notified = 0;
        let emailed = 0;
        for (const task of tasks ?? []) {
          if (!task.owner_id) continue;

          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", task.owner_id)
            .single();

          if (!profile?.email) continue;

          const isOverdue = task.due_at && new Date(task.due_at) < new Date();
          const action = isOverdue ? "overdue" : "due_soon";
          const title = isOverdue ? "Task Overdue" : "Task Due Soon";
          const projName = Array.isArray(task.projects) ? (task.projects as any[])[0]?.name : null;
          const body = `"${task.title}"${isOverdue ? " is overdue" : " is due within 24 hours"}${projName ? ` in project ${projName}` : ""}.`;

          await createInAppNotification(supabase, task.owner_id, title, body, "tickets", task.id, action);

          const emailSent = await sendEmail({
            to: profile.email,
            subject: `[Maine CyberTech] ${title}: ${task.title}`,
            text: `Hello ${profile.full_name ?? "there"},\n\n${body}\n\nView your tasks: ${env.API_BASE_URL ?? ""}/portal/tickets/${task.id}`,
            html: `<p>Hello ${profile.full_name ?? "there"},</p><p>${body}</p><p><a href="${env.API_BASE_URL ?? ""}/portal/tickets/${task.id}">View task</a></p>`,
          });
          if (emailSent) emailed++;

          notified++;
        }

        logger.info({ notified, emailed, total: (tasks ?? []).length }, "Task-due notifications processed");
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

        await createInAppNotification(supabase, p.targetUserId, "Membership Approved", "Your organization membership has been approved.", "system", undefined, "created");

        logger.info({ email: profile.email }, "Membership approved notification sent");
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

        await createInAppNotification(supabase, p.targetUserId, p.title ?? "Ticket Updated", p.body ?? "A ticket has been updated.", "tickets", (p.metadata?.ticketId as string) ?? undefined, "updated");

        const emailSent = await sendEmail({
          to: profile.email,
          subject: `[Maine CyberTech] ${p.title ?? "Ticket Update"}`,
          text: `Hello ${profile.full_name ?? "there"},\n\n${p.body ?? "A ticket has been updated."}\n\nView: ${env.API_BASE_URL ?? ""}/portal/tickets/${p.metadata?.ticketId ?? ""}`,
          html: `<p>Hello ${profile.full_name ?? "there"},</p><p>${p.body ?? "A ticket has been updated."}</p><p><a href="${env.API_BASE_URL ?? ""}/portal/tickets/${p.metadata?.ticketId ?? ""}">View ticket</a></p>`,
        });

        logger.info({ email: profile.email, title: p.title, emailSent }, "Ticket responded notification sent");
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

        await createInAppNotification(supabase, p.targetUserId, p.title, p.body ?? "", "system", undefined, "created");

        const emailSent = await sendEmail({
          to: profile.email,
          subject: `[Maine CyberTech] ${p.title}`,
          text: `Hello ${profile.full_name ?? "there"},\n\n${p.body ?? ""}`,
          html: `<p>Hello ${profile.full_name ?? "there"},</p><p>${p.body ?? ""}</p>`,
        });

        logger.info({ email: profile.email, title: p.title, emailSent }, "Custom notification sent");
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
