import { createHash } from "crypto";
import { getSupabaseAdmin } from "../services/supabase";
import { sendEmail } from "./email";
import { enqueueTask } from "./task-producer";
import { logger } from "./logger";
import { getEnv } from "../config/env";
import { resolveChannels, type ResolvedChannels } from "./notification-channels";
import {
  recordNotificationDelivery,
  recordNotificationDedup,
  recordNotificationSuppressed,
} from "./metrics";

type NotificationModule = "tickets" | "projects" | "documents" | "billing" | "system";

type NotifyOptions = {
  userId: string;
  organizationId?: string;
  title: string;
  body: string;
  module: NotificationModule;
  moduleId?: string;
  action: string;
  emailOverride?: boolean;
  /**
   * Explicit idempotency key. Use this when the event itself has a natural
   * unique id (e.g. a comment id) so a retry/replay is deduped without
   * suppressing a genuinely distinct later event. When omitted, a stable key is
   * derived from the target and the content, so identical retries dedupe while
   * later distinct events (new comment text, new assignee) still notify.
   */
  notificationKey?: string;
};

export interface CreateNotificationResult {
  /** True when a new in-app row was inserted (false when suppressed/deduped/failed). */
  inserted: boolean;
  /** True when the insert was skipped because the dedup key already existed. */
  deduped: boolean;
  /** True when the recipient disabled the in_app channel. */
  suppressed: boolean;
}

export interface NotifyResult extends CreateNotificationResult {
  emailQueued: boolean;
  emailSent: boolean;
  emailSkipped: boolean;
}

/** Escape user-controlled content before interpolating it into email HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Deterministic dedup key used against the partial unique index
 * `idx_notifications_key` (NOTIF-P1-002). The admin endpoint uses
 * `${userId}-${module}-${moduleId}-${action}`; we keep that as a prefix and add
 * a short content fingerprint. The fingerprint prevents a permanent key from
 * suppressing legitimate repeat events (e.g. a second comment on the same
 * ticket) while still deduping byte-identical retries/replays.
 */
export function buildNotificationKey(opts: {
  userId: string;
  module: string;
  moduleId?: string | null;
  action: string;
  title: string;
  body: string;
}): string {
  const fingerprint = createHash("sha256")
    .update(`${opts.title}\n${opts.body}`)
    .digest("hex")
    .slice(0, 16);
  return `${opts.userId}-${opts.module}-${opts.moduleId ?? "none"}-${opts.action}-${fingerprint}`;
}

async function insertNotification(
  opts: NotifyOptions,
  notificationKey: string,
): Promise<{ inserted: boolean; deduped: boolean }> {
  const supabase = getSupabaseAdmin();
  // Upsert + ignoreDuplicates maps to ON CONFLICT (notification_key) DO NOTHING,
  // so a retried/replayed send is a no-op instead of a duplicate row.
  const { data, error } = await supabase
    .from("notifications")
    .upsert(
      {
        user_id: opts.userId,
        organization_id: opts.organizationId ?? null,
        title: opts.title,
        body: opts.body,
        module: opts.module,
        module_id: opts.moduleId ?? null,
        action: opts.action,
        notification_key: notificationKey,
      },
      { onConflict: "notification_key", ignoreDuplicates: true },
    )
    .select("id");

  if (error) throw new Error(error.message);
  const inserted = Array.isArray(data) && data.length > 0;
  return { inserted, deduped: !inserted };
}

export async function createNotification(
  opts: NotifyOptions,
  resolvedChannels?: ResolvedChannels,
): Promise<CreateNotificationResult> {
  const channels = resolvedChannels ?? (await resolveChannels({
    userId: opts.userId,
    organizationId: opts.organizationId,
    module: opts.module,
  }));

  if (!channels.in_app) {
    recordNotificationSuppressed("in_app", opts.module);
    logger.info(
      { userId: opts.userId, module: opts.module, action: opts.action },
      "In-app notification suppressed by user preference",
    );
    return { inserted: false, deduped: false, suppressed: true };
  }

  const notificationKey =
    opts.notificationKey ??
    buildNotificationKey({
      userId: opts.userId,
      module: opts.module,
      moduleId: opts.moduleId,
      action: opts.action,
      title: opts.title,
      body: opts.body,
    });

  try {
    const { inserted, deduped } = await insertNotification(opts, notificationKey);
    if (deduped) recordNotificationDedup("in_app");
    recordNotificationDelivery("in_app", inserted ? "success" : "skipped");
    return { inserted, deduped, suppressed: false };
  } catch (error) {
    logger.warn(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: opts.userId,
        title: opts.title,
        notificationKey,
      },
      "Failed to create in-app notification",
    );
    recordNotificationDelivery("in_app", "failed");
    return { inserted: false, deduped: false, suppressed: false };
  }
}

export async function notifyAndEmail(
  opts: NotifyOptions & { email?: string; emailHtml?: string },
): Promise<NotifyResult> {
  // Resolve preferences once and share the result between the in-app and email
  // gates so we do not read preferences twice per notification.
  const channels = await resolveChannels({
    userId: opts.userId,
    organizationId: opts.organizationId,
    module: opts.module,
  });

  const inApp = await createNotification(opts, channels);

  const baseUrl = getEnv().APP_BASE_URL;
  // CodeQL js/xss (alert #6): the module id is user-provided route data (e.g.
  // a ticket id). Percent-encode it before it becomes a path segment so it
  // cannot terminate the href attribute, and escape the final URL as defense
  // in depth below.
  const moduleIdSegment = opts.moduleId ? encodeURIComponent(opts.moduleId) : "";
  const modulePath =
    opts.module === "tickets" && opts.moduleId
      ? `/portal/tickets/${moduleIdSegment}`
      : opts.module === "projects" && opts.moduleId
        ? `/portal/projects/${moduleIdSegment}`
        : opts.module === "documents" && opts.moduleId
          ? `/portal/documents/${moduleIdSegment}`
          : "";

  const emailTo = opts.email;
  const emailSkipped = !channels.email || !emailTo;

  if (emailSkipped) {
    if (!channels.email) {
      recordNotificationSuppressed("email", opts.module);
      logger.info(
        { userId: opts.userId, module: opts.module, action: opts.action },
        "Email notification suppressed by user preference",
      );
    }
    return { ...inApp, emailQueued: false, emailSent: false, emailSkipped: true };
  }

  const emailPayload = {
    to: emailTo,
    subject: `[Maine CyberTech] ${opts.title}`,
    text: `${opts.body}\n\nView: ${baseUrl}${modulePath}`,
    html:
      opts.emailHtml ??
      `<p>${escapeHtml(opts.body).replace(/\n/g, "<br/>")}</p>${modulePath ? `<p><a href="${escapeHtml(`${baseUrl}${modulePath}`)}">View details</a></p>` : ""}`,
  };

  // Route email through the worker queue when available (retries + backoff);
  // fall back to sending inline so the notification is never lost.
  const enqueued = await enqueueTask("notification-email", emailPayload);
  if (enqueued) {
    // The worker owns delivery from here; a queued job is recorded as a
    // successful hand-off so an enqueue is never mistaken for a failed send.
    recordNotificationDelivery("email", "success");
    return { ...inApp, emailQueued: true, emailSent: false, emailSkipped: false };
  }

  const sent = await sendEmail(emailPayload);
  if (!sent) {
    logger.error(
      { userId: opts.userId, module: opts.module, action: opts.action, subject: emailPayload.subject },
      "Inline email delivery failed (queue unavailable and SMTP send unsuccessful)",
    );
    recordNotificationDelivery("email", "failed");
  } else {
    recordNotificationDelivery("email", "success");
  }
  return { ...inApp, emailQueued: false, emailSent: sent, emailSkipped: false };
}
