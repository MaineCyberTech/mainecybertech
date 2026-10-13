import { createHash } from "crypto";
import { incrementIdempotencyCounter } from "./idempotency";
import { logger } from "./logger";

/**
 * NOTIF-P3-007: per-recipient email throttle shared by every API send path.
 *
 * The global per-user limiter (600 req/15 min) still allows a member to
 * generate hundreds of distinct comment emails per hour (distinct bodies defeat
 * the dedup fingerprint), so the notification producers need their own
 * recipient-scoped ceiling. The counter is keyed by a hash of the recipient
 * address (never the plaintext address) in fixed one-hour buckets, so a burst
 * is bounded even across API replicas (Redis INCR) and degrades to a
 * per-process count without Redis.
 *
 * Fail-open: if the counter store errors the send proceeds — a throttle must
 * never silently drop a user-visible notification.
 */

export const EMAIL_THROTTLE_WINDOW_SECONDS = 60 * 60;
export const EMAIL_THROTTLE_MAX_PER_WINDOW = 30;

export function recipientThrottleKey(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

/**
 * Returns true when the recipient has exhausted the per-hour email budget.
 * The counter is incremented for every attempted send (including sends that
 * later fail), which is the conservative direction for an abuse throttle.
 */
export async function isEmailThrottled(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  const bucket = Math.floor(Date.now() / (EMAIL_THROTTLE_WINDOW_SECONDS * 1000));
  const key = `notif-throttle:email:${recipientThrottleKey(email)}:${bucket}`;
  try {
    const count = await incrementIdempotencyCounter(key, EMAIL_THROTTLE_WINDOW_SECONDS * 2);
    return count > EMAIL_THROTTLE_MAX_PER_WINDOW;
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : String(error) },
      "Email throttle check failed — allowing the send (fail-open)",
    );
    return false;
  }
}
