import { getSupabaseAdmin } from "../services/supabase";
import { logger } from "../logger";
import { recordNotificationDelivery, recordPushSubscriptionRevoked } from "../metrics";
import { buildPushPayload, isPushConfigured, sendPush, type PushSubscription } from "../push";
import type { TaskHandler, TaskResult } from "../task-registry";

/**
 * Deliver a queued notification to a user's browser push subscriptions
 * (NOTIF-P2-001).
 *
 * Per-subscription failure handling:
 *   - 404/410 → revoke the subscription (`revoked_at`) and count it; the
 *     device is gone and must not be retried.
 *   - other failures → counted as `failed`.
 *
 * Partial failure is deliberately NOT retried: a BullMQ retry re-runs the
 * whole batch and would re-send to the subscriptions that already succeeded.
 * Only a run where every attempted send failed returns `ok: false` so the
 * queue retries (revoked subscriptions are excluded from the next attempt).
 */

type NotificationPushPayload = {
  userId?: string;
  title?: string;
  body?: string;
  url?: string;
};

export const notificationPush: TaskHandler = async (payload): Promise<TaskResult> => {
  const { userId, title, body, url } = payload as NotificationPushPayload;

  if (!userId || !title || !body) {
    return { ok: false, error: "userId, title and body are required" };
  }

  // Operator-gated: no VAPID keys means the channel is disabled. This is a
  // no-op, not a failure (matches the SMTP-unset email behavior).
  if (!isPushConfigured()) {
    logger.warn("VAPID is not configured — notification-push is a no-op");
    recordNotificationDelivery("push", "skipped");
    return { ok: true };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (error) {
    logger.error(
      { error: error.message, userId },
      "Failed to load push subscriptions",
    );
    return { ok: false, error: `Failed to load push subscriptions: ${error.message}` };
  }

  const subscriptions = (data ?? []) as Array<PushSubscription & { id: string }>;
  if (subscriptions.length === 0) {
    recordNotificationDelivery("push", "skipped");
    return { ok: true };
  }

  const pushPayload = buildPushPayload({ title, body, url });

  let successes = 0;
  let failures = 0;

  for (const subscription of subscriptions) {
    const result = await sendPush(subscription, pushPayload);

    if (result.status === "success") {
      successes += 1;
      recordNotificationDelivery("push", "success");
      // Best-effort liveness stamp; a failed touch must not fail the send.
      const { error: touchError } = await supabase
        .from("push_subscriptions")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", subscription.id);
      if (touchError) {
        logger.warn(
          { error: touchError.message, subscriptionId: subscription.id },
          "Failed to update push subscription last_seen_at",
        );
      }
      continue;
    }

    if (result.status === "revoked") {
      recordNotificationDelivery("push", "skipped");
      recordPushSubscriptionRevoked();
      const { error: revokeError } = await supabase
        .from("push_subscriptions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", subscription.id);
      if (revokeError) {
        logger.warn(
          { error: revokeError.message, subscriptionId: subscription.id },
          "Failed to revoke a push subscription the push service reported as gone",
        );
      }
      logger.info(
        { statusCode: result.statusCode, subscriptionId: subscription.id },
        "Push subscription revoked (push service reported it gone)",
      );
      continue;
    }

    failures += 1;
    recordNotificationDelivery("push", "failed");
    logger.warn(
      {
        error: result.error,
        statusCode: result.statusCode,
        subscriptionId: subscription.id,
      },
      "Push send failed",
    );
  }

  if (failures > 0 && successes === 0) {
    return { ok: false, error: `Push failed for all ${failures} subscription(s)` };
  }

  return { ok: true };
};
