import { env } from "../env";
import { wsTransport } from "../services/supabase";
import { logger } from "../logger";
import { sendEmail } from "../email";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskHandler, TaskResult } from "../task-registry";
import {
  insertNotification,
  resolveChannels,
  buildNotificationKey,
  claimNotificationEmail,
} from "../notification-store";
import { redactSensitiveContent } from "../notification-content";
import { isEmailThrottled } from "../lib/notification-throttle";
import { buildNotificationEmail } from "@mct/sdk/email-template";
import { buildUnsubscribeUrl } from "../lib/unsubscribe-token";
import {
  recordNotificationDelivery,
  recordNotificationSuppressed,
  recordNotificationThrottled,
} from "../metrics";

interface NotificationPayload {
  type?: "task-due" | "membership-approved" | "ticket-responded" | "custom";
  targetUserId?: string;
  organizationId?: string;
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
}

/** Base URL for portal deep links and footer links (same convention as the API). */
function appBaseUrl(): string {
  return (env.APP_BASE_URL ?? env.API_BASE_URL ?? "").replace(/\/$/, "");
}

/**
 * NOTIF-P3-001 / NOTIF-P3-005 / NOTIF-P3-007: one send path for every worker
 * email. Builds the shared template (footer with preferences + signed
 * unsubscribe links), enforces the per-recipient throttle, and records the
 * terminal delivery outcome exactly once.
 */
async function sendNotificationEmail(opts: {
  to: string;
  userId: string;
  organizationId?: string | null;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}): Promise<boolean> {
  if (await isEmailThrottled(opts.to)) {
    recordNotificationThrottled("email");
    logger.warn(
      { userId: opts.userId, title: opts.title },
      "Notification email throttled per recipient",
    );
    return false;
  }

  const baseUrl = appBaseUrl();
  const email = buildNotificationEmail({
    title: opts.title,
    body: opts.body,
    actionUrl: opts.actionUrl,
    actionLabel: opts.actionLabel,
    preferencesUrl: baseUrl ? `${baseUrl}/portal/notifications/preferences` : undefined,
    unsubscribeUrl:
      opts.organizationId && env.SUPABASE_SERVICE_ROLE_KEY
        ? buildUnsubscribeUrl({
            apiBaseUrl: baseUrl,
            userId: opts.userId,
            organizationId: opts.organizationId,
            serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
          })
        : undefined,
  });

  const sent = await sendEmail({ to: opts.to, ...email });
  recordNotificationDelivery("email", sent ? "success" : "failed");
  return sent;
}

/**
 * Preference-gated, deduped in-app insert. Kept as a thin wrapper so existing
 * call sites keep their shape while routing through the shared enforcement path
 * (NOTIF-P1-001) and setting a dedup `notification_key` (NOTIF-P1-002).
 */
async function createInAppNotification(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  module: string,
  moduleId?: string,
  action: string = "updated",
  organizationId?: string | null,
) {
  return insertNotification(supabase, {
    userId,
    organizationId,
    title,
    body,
    module,
    moduleId,
    action,
  });
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
        const dueBefore = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { data: tasks } = await supabase
          .from("project_tasks")
          // NOTIF-P3-006: carry the task's organization so preference lookups
          // are per-org (the worker used to read every org's rows for the user).
          .select("id, title, due_at, owner_id, project_id, organization_id, projects(name)")
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
          // NOTIF-P2-005: task/project names are user-supplied; run the
          // sensitivity filter before the body is stored or emailed.
          const taskTitle = redactSensitiveContent(task.title);
          const body = redactSensitiveContent(
            `"${taskTitle}"${isOverdue ? " is overdue" : " is due within 24 hours"}${projName ? ` in project ${projName}` : ""}.`,
          );
          const link = `${appBaseUrl()}/portal/projects/${task.project_id}`;

          // Dedupe: the scan runs daily and a task can stay overdue for days,
          // so do not re-notify/re-email the same task within a week.
          if (alerted.has(`${task.owner_id}|${task.id}|${action}`)) continue;

          // Enforce the recipient's per-module channel preferences. A disabled
          // in_app channel suppresses the row; a disabled email channel
          // suppresses the send but not the in-app row (and vice versa).
          // NOTIF-P3-006: scoped to the task's org so another org's opt-out
          // cannot silence this one.
          const channels = await resolveChannels(supabase, {
            userId: task.owner_id,
            organizationId: task.organization_id,
            module: "projects",
          });

          // NOTIF-P2-004: the notification_key upsert is the atomic claim that
          // decides which run owns the email send (retries/concurrent replicas
          // must not double-send).
          const notificationKey = buildNotificationKey({
            userId: task.owner_id,
            module: "projects",
            moduleId: task.id,
            action,
            title,
            body,
          });

          const inApp = await insertNotification(
            supabase,
            {
              userId: task.owner_id,
              organizationId: task.organization_id,
              title,
              body,
              module: "projects",
              moduleId: task.id,
              action,
              notificationKey,
            },
            channels,
          );

          if (!channels.email) {
            recordNotificationSuppressed("email", "projects");
            logger.info(
              { userId: task.owner_id, module: "projects", action },
              "Task-due email suppressed by user preference",
            );
          } else if (!(await claimNotificationEmail(inApp, notificationKey))) {
            logger.info(
              { userId: task.owner_id, module: "projects", action },
              "Task-due email already claimed by another run — skipping",
            );
          } else {
            const emailSent = await sendNotificationEmail({
              to: profile.email,
              userId: task.owner_id,
              organizationId: task.organization_id,
              title: `${title}: ${taskTitle}`,
              body: `Hello ${profile.full_name ?? "there"},\n\n${body}`,
              actionUrl: link,
              actionLabel: "View project",
            });
            if (emailSent) emailed++;
          }

          if (inApp.inserted) notified++;
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
          p.organizationId ?? null,
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

        const channels = await resolveChannels(supabase, {
          userId: p.targetUserId,
          // NOTIF-P3-006: scope the preference lookup to the notification's
          // organization so another org's opt-out cannot silence this channel.
          organizationId: p.organizationId,
          module: "tickets",
        });

        // NOTIF-P2-005: ticket payload text is user-supplied; run the
        // sensitivity filter before the body is stored or emailed.
        const ticketTitle = redactSensitiveContent(p.title ?? "Ticket Updated");
        const ticketBody = redactSensitiveContent(p.body ?? "A ticket has been updated.");
        // NOTIF-P2-004: one atomic claim per notification owns the email send.
        const notificationKey = buildNotificationKey({
          userId: p.targetUserId,
          module: "tickets",
          moduleId: ticketId,
          action: "updated",
          title: ticketTitle,
          body: ticketBody,
        });
        const inApp = await insertNotification(
          supabase,
          {
            userId: p.targetUserId,
            organizationId: p.organizationId,
            title: ticketTitle,
            body: ticketBody,
            module: "tickets",
            moduleId: ticketId,
            action: "updated",
            notificationKey,
          },
          channels,
        );

        if (!channels.email) {
          recordNotificationSuppressed("email", "tickets");
          logger.info(
            { userId: p.targetUserId, module: "tickets", action: "updated" },
            "Ticket-responded email suppressed by user preference",
          );
        } else if (!(await claimNotificationEmail(inApp, notificationKey))) {
          logger.info(
            { userId: p.targetUserId, module: "tickets", action: "updated" },
            "Ticket-responded email already claimed by another run — skipping",
          );
        } else {
          // NOTIF-P3-008: percent-encode the caller-controlled ticket id before
          // it becomes a path segment, and let the shared template escape the
          // final URL — the worker twin of the API's CodeQL js/xss fix.
          const ticketIdSegment = ticketId ? encodeURIComponent(ticketId) : "";
          const ticketLink = `${appBaseUrl()}/portal/tickets/${ticketIdSegment}`;
          await sendNotificationEmail({
            to: profile.email,
            userId: p.targetUserId,
            organizationId: p.organizationId,
            title: ticketTitle,
            body: `Hello ${profile.full_name ?? "there"},\n\n${ticketBody}`,
            actionUrl: ticketLink,
            actionLabel: "View ticket",
          });
        }

        logger.info(
          { userId: p.targetUserId, title: ticketTitle },
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

        const channels = await resolveChannels(supabase, {
          userId: p.targetUserId,
          // NOTIF-P3-006: org-scoped preference lookup (was org-agnostic).
          organizationId: p.organizationId,
          module: "system",
        });

        // NOTIF-P2-005: admin-supplied text is filtered before storage/email.
        const customTitle = redactSensitiveContent(p.title ?? "");
        const customBody = redactSensitiveContent(p.body ?? "");
        // NOTIF-P2-004: one atomic claim per notification owns the email send.
        const notificationKey = buildNotificationKey({
          userId: p.targetUserId,
          module: "system",
          moduleId: null,
          action: "created",
          title: customTitle,
          body: customBody,
        });
        const inApp = await insertNotification(
          supabase,
          {
            userId: p.targetUserId,
            organizationId: p.organizationId,
            title: customTitle,
            body: customBody,
            module: "system",
            moduleId: null,
            action: "created",
            notificationKey,
          },
          channels,
        );

        if (!channels.email) {
          recordNotificationSuppressed("email", "system");
          logger.info(
            { userId: p.targetUserId, module: "system", action: "created" },
            "Custom notification email suppressed by user preference",
          );
        } else if (!(await claimNotificationEmail(inApp, notificationKey))) {
          logger.info(
            { userId: p.targetUserId, module: "system", action: "created" },
            "Custom notification email already claimed by another run — skipping",
          );
        } else {
          await sendNotificationEmail({
            to: profile.email,
            userId: p.targetUserId,
            organizationId: p.organizationId,
            title: customTitle,
            body: `Hello ${profile.full_name ?? "there"},\n\n${customBody}`,
          });
        }

        logger.info({ userId: p.targetUserId, title: customTitle }, "Custom notification sent");
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
