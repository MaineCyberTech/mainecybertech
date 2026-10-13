import { createHash } from "crypto";
import { incrementIdempotencyCounter } from "./idempotency";
import { logger } from "../logger";

/**
 * NOTIF-P3-007: per-recipient email throttle (worker mirror of the API helper
 * in `apps/api/src/lib/notification-throttle.ts`).
 *
 * The worker is a separate deployable and cannot import API source, so the
 * small counter helper is duplicated here with the same key shape — both
 * services must throttle against the same Redis counter or the limit would be
 * per-service instead of per-recipient.
 *
 * Fail-open: a counter-store error must never drop a user-visible email.
 */

export const EMAIL_THROTTLE_WINDOW_SECONDS = 60 * 60;
export const EMAIL_THROTTLE_MAX_PER_WINDOW = 30;

export function recipientThrottleKey(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

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
