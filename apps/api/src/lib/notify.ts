import { createHash } from "crypto";
import { getSupabaseAdmin } from "../services/supabase";
import { sendEmail } from "./email";
import { enqueueTask } from "./task-producer";
import { logger } from "./logger";
import { getEnv } from "../config/env";
import { claimIdempotencyKey } from "./idempotency";
import { resolveChannels, type ResolvedChannels } from "./notification-channels";
import { redactSensitiveContent } from "./notification-content";
import { isEmailThrottled } from "./notification-throttle";
import {
  EMAIL_SUBJECT_PREFIX,
  buildNotificationEmail,
  notificationFooterLinks,
  renderEmailLayout,
} from "@mct/sdk/email-template";
import { buildUnsubscribeUrl } from "./unsubscribe-token";
import {
  recordNotificationDelivery,
  recordNotificationDedup,
  recordNotificationSuppressed,
  recordNotificationThrottled,
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
  /** True when the email was dropped by the per-recipient throttle (NOTIF-P3-007). */
  emailThrottled?: boolean;
  pushQueued: boolean;
  pushSkipped: boolean;
}

/** NOTIF-P2-005: apply the sensitivity filter to the stored/emailed fields. */
function sanitizeNotificationOptions(opts: NotifyOptions): NotifyOptions {
  return {
    ...opts,
    title: redactSensitiveContent(opts.title),
    body: redactSensitiveContent(opts.body),
  };
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

  // NOTIF-P2-005: filter secrets/PII before the row is stored (and before the
  // dedup key is derived, so a retried replay still hashes identically).
  const safeOpts = sanitizeNotificationOptions(opts);

  const notificationKey =
    opts.notificationKey ??
    buildNotificationKey({
      userId: safeOpts.userId,
      module: safeOpts.module,
      moduleId: safeOpts.moduleId,
      action: safeOpts.action,
      title: safeOpts.title,
      body: safeOpts.body,
    });

  try {
    const { inserted, deduped } = await insertNotification(safeOpts, notificationKey);
    if (deduped) recordNotificationDedup("in_app");
    recordNotificationDelivery("in_app", inserted ? "success" : "skipped");
    return { inserted, deduped, suppressed: false };
  } catch (error) {
    logger.warn(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: opts.userId,
        title: safeOpts.title,
        notificationKey,
      },
      "Failed to create in-app notification",
    );
    recordNotificationDelivery("in_app", "failed");
    return { inserted: false, deduped: false, suppressed: false };
  }
}

/**
 * NOTIF-P2-009: decide whether THIS API call owns the email send.
 *
 * Mirrors the worker's `claimNotificationEmail`
 * (apps/worker/src/notification-store.ts) so the API path has the same
 * email-side idempotency as the worker queue. The `notification_key` upsert in
 * `createNotification` is itself an atomic claim: only the first writer gets
 * `inserted: true`, so a replayed request must not email again. When the in-app
 * channel is disabled by preference no row is written, so fall back to the
 * idempotency store (24h TTL) — a retry inside that window still cannot
 * double-send.
 */
export async function claimNotificationEmail(
  inApp: CreateNotificationResult,
  notificationKey: string,
): Promise<boolean> {
  if (inApp.inserted) return true;
  if (inApp.deduped) return false;
  return claimIdempotencyKey(`notif-email-${notificationKey}`, "sent");
}

/**
 * NOTIF-P2-001: decide whether THIS API call owns the push send. Mirrors
 * `claimNotificationEmail` with a channel-specific key so a replay cannot
 * enqueue a second `notification-push` job while the email path stays
 * independently claimable.
 */
export async function claimNotificationPush(
  inApp: CreateNotificationResult,
  notificationKey: string,
): Promise<boolean> {
  if (inApp.inserted) return true;
  if (inApp.deduped) return false;
  return claimIdempotencyKey(`notif-push-${notificationKey}`, "sent");
}

export interface PushDeliveryResult {
  pushQueued: boolean;
  pushSkipped: boolean;
}

/**
 * NOTIF-P2-001: hand a notification to the worker's `notification-push` task.
 *
 * Operator-gated: without VAPID_PUBLIC_KEY the channel is disabled and the
 * attempt is metered as `skipped` (a no-op, not a failure). With keys set, the
 * user's active subscriptions are counted first so a user who never granted
 * the browser permission does not generate queue noise. Delivery is queued
 * (the worker holds the private key and does the encryption); a failed enqueue
 * is recorded as a terminal `failed` because there is no inline fallback.
 */
export async function deliverPush(
  opts: { userId: string; title: string; body: string; url?: string },
  inApp: CreateNotificationResult,
  notificationKey: string,
  module: string,
): Promise<PushDeliveryResult> {
  if (!getEnv().VAPID_PUBLIC_KEY) {
    recordNotificationDelivery("push", "skipped");
    logger.info(
      { userId: opts.userId, module },
      "Push notification skipped — VAPID is not configured (channel disabled)",
    );
    return { pushQueued: false, pushSkipped: true };
  }

  // Same idempotency contract as email: the in-app upsert (or, when in-app is
  // suppressed, the idempotency store) is the send claim.
  if (!(await claimNotificationPush(inApp, notificationKey))) {
    recordNotificationDedup("push");
    logger.info(
      { userId: opts.userId, module },
      "Push notification skipped — already claimed by an earlier delivery",
    );
    return { pushQueued: false, pushSkipped: true };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", opts.userId)
      .is("revoked_at", null);

    if (error) throw new Error(error.message);

    if (!count) {
      recordNotificationDelivery("push", "skipped");
      return { pushQueued: false, pushSkipped: true };
    }
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: opts.userId,
        module,
      },
      "Failed to read push subscriptions",
    );
    recordNotificationDelivery("push", "failed");
    return { pushQueued: false, pushSkipped: false };
  }

  const enqueued = await enqueueTask("notification-push", {
    userId: opts.userId,
    title: opts.title,
    body: opts.body,
    url: opts.url,
  });

  if (!enqueued) {
    logger.error(
      { userId: opts.userId, module },
      "Push notification could not be queued and has no inline fallback",
    );
    recordNotificationDelivery("push", "failed");
    return { pushQueued: false, pushSkipped: false };
  }

  recordNotificationDelivery("push", "queued");
  return { pushQueued: true, pushSkipped: false };
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

  // NOTIF-P2-005: filter secrets/PII once for both channels; the sanitized
  // values feed the dedup key, the stored row and the email payload.
  const safeOpts = sanitizeNotificationOptions(opts);

  // Derive the dedup key once and share it with the email claim below so both
  // channels are gated by the same `notification_key`.
  const notificationKey =
    opts.notificationKey ??
    buildNotificationKey({
      userId: safeOpts.userId,
      module: safeOpts.module,
      moduleId: safeOpts.moduleId,
      action: safeOpts.action,
      title: safeOpts.title,
      body: safeOpts.body,
    });

  const inApp = await createNotification({ ...safeOpts, notificationKey }, channels);

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
          : opts.module === "billing"
            ? // Billing is org-scoped (no per-row page); the portal billing page
              // hosts the Stripe portal entry point (BILL-P2-004 dunning link).
              "/portal/billing"
            : "";

  const emailTo = opts.email;
  const emailSkipped = !channels.email || !emailTo;

  // NOTIF-P2-001: resolve the push attempt up front (its result is part of
  // every return path below). Preference-disabled push is recorded as
  // suppressed; otherwise the worker queue owns the send.
  let push: PushDeliveryResult;
  if (!channels.push) {
    recordNotificationSuppressed("push", opts.module);
    logger.info(
      { userId: opts.userId, module: opts.module, action: opts.action },
      "Push notification suppressed by user preference",
    );
    push = { pushQueued: false, pushSkipped: true };
  } else {
    push = await deliverPush(
      {
        userId: safeOpts.userId,
        title: safeOpts.title,
        body: safeOpts.body,
        url: modulePath ? `${baseUrl}${modulePath}` : undefined,
      },
      inApp,
      notificationKey,
      opts.module,
    );
  }

  if (emailSkipped) {
    if (!channels.email) {
      recordNotificationSuppressed("email", opts.module);
      logger.info(
        { userId: opts.userId, module: opts.module, action: opts.action },
        "Email notification suppressed by user preference",
      );
    }
    return { ...inApp, ...push, emailQueued: false, emailSent: false, emailSkipped: true };
  }

  // NOTIF-P2-009: the in-app insert (or, when in-app is disabled, the
  // idempotency store) is the email claim. A deduped/replayed notification
  // must not enqueue or send a second email.
  if (!(await claimNotificationEmail(inApp, notificationKey))) {
    recordNotificationDedup("email");
    logger.info(
      { userId: opts.userId, module: opts.module, action: opts.action },
      "Email notification skipped — already claimed by an earlier delivery",
    );
    return { ...inApp, ...push, emailQueued: false, emailSent: false, emailSkipped: true };
  }

  // NOTIF-P3-007: bound how many emails one recipient can receive per hour.
  // The global limiter still allows hundreds of distinct comment emails; this
  // recipient-scoped bucket drops only the email (the in-app row stays) and
  // meters the drop separately from a preference opt-out.
  if (await isEmailThrottled(emailTo)) {
    recordNotificationThrottled("email");
    logger.warn(
      { userId: opts.userId, module: opts.module, action: opts.action },
      "Email notification throttled per recipient",
    );
    return {
      ...inApp,
      ...push,
      emailQueued: false,
      emailSent: false,
      emailSkipped: true,
      emailThrottled: true,
    };
  }

  // NOTIF-P3-001: one shared template builds subject/text/html (branding,
  // footer) for every sender. NOTIF-P3-005: the footer carries the
  // preferences link and a signed one-click unsubscribe link.
  const actionUrl = modulePath ? `${baseUrl}${modulePath}` : undefined;
  const preferencesUrl = `${baseUrl}/portal/notifications/preferences`;
  const unsubscribeUrl = opts.organizationId
    ? buildUnsubscribeUrl({
        apiBaseUrl: baseUrl,
        userId: safeOpts.userId,
        organizationId: opts.organizationId,
        serviceRoleKey: getEnv().SUPABASE_SERVICE_ROLE_KEY,
      })
    : undefined;
  const footerLinks = notificationFooterLinks({ preferencesUrl, unsubscribeUrl });

  const emailPayload =
    opts.emailHtml != null
      ? {
          to: emailTo,
          subject: `${EMAIL_SUBJECT_PREFIX} ${safeOpts.title}`,
          text: [
            safeOpts.body,
            ...(actionUrl ? [`View: ${actionUrl}`] : []),
            ...footerLinks.map((link) => `${link.label}: ${link.url}`),
          ].join("\n\n"),
          html: renderEmailLayout({
            heading: safeOpts.title,
            bodyHtml: redactSensitiveContent(opts.emailHtml),
            actionUrl,
            actionLabel: "View details",
            footerLinks,
          }),
        }
      : {
          to: emailTo,
          ...buildNotificationEmail({
            title: safeOpts.title,
            body: safeOpts.body,
            actionUrl,
            actionLabel: "View details",
            preferencesUrl,
            unsubscribeUrl,
          }),
        };

  // Route email through the worker queue when available (retries + backoff);
  // fall back to sending inline so the notification is never lost.
  const enqueued = await enqueueTask("notification-email", emailPayload);
  if (enqueued) {
    // NOTIF-P2-010: a queued job is a hand-off, not a delivery. Record it as
    // `queued` so a successful enqueue can never be read as a successful send;
    // the worker records the terminal outcome on its own counter, which the
    // delivery SLO (docs/SLO.md) is computed from.
    recordNotificationDelivery("email", "queued");
    return { ...inApp, ...push, emailQueued: true, emailSent: false, emailSkipped: false };
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
  return { ...inApp, ...push, emailQueued: false, emailSent: sent, emailSkipped: false };
}
