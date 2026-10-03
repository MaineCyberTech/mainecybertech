import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison.
 *
 * `crypto.timingSafeEqual` requires equal-length buffers, so a length mismatch
 * is handled here (it returns false) rather than throwing. This removes the
 * timing side channel that a plain `===` comparison exposes on secrets such as
 * the CSRF token and the M365 webhook `clientState` (SEC-P3-002).
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
