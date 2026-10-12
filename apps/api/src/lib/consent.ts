/**
 * PRIV-P2-002: consent recording.
 *
 * Consent is recorded server-side with the version of the privacy policy the
 * visitor was shown. Bump `CONSENT_POLICY_VERSION` when the policy materially
 * changes; the web consent store (`apps/web/lib/consent.ts` `CONSENT_VERSION`)
 * is kept in sync.
 */
export const CONSENT_POLICY_VERSION = "1";

/**
 * Bounded, defaulted version string for a consent record. Callers forward the
 * version their UI stored; anything missing, empty or oversized falls back to
 * the server's current policy version.
 */
export function consentVersionFrom(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 64
    ? value
    : CONSENT_POLICY_VERSION;
}
