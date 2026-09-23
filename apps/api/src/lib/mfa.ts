/**
 * MFA (aal2) enforcement.
 *
 * The portal delegates identity to hosted Supabase, so factors live in GoTrue's
 * `auth.mfa_factors`. Enforcement is **opt-in** via `MFA_ENFORCEMENT_ENABLED`
 * and only ever blocks a user who has a *verified* factor but an `aal1` session
 * — so turning it on can never lock out users who have not enrolled.
 *
 * The factor lookup is cached briefly and fails open on a GoTrue error: a
 * control-plane hiccup must not take the whole API down for MFA users. The
 * failure is logged so the gap is visible.
 */
import { getEnv } from "../config/env";
import { getSupabaseAdmin } from "../services/supabase";
import { logger } from "./logger";

export type AssuranceLevel = "aal1" | "aal2";

const FACTOR_CACHE_TTL_MS = 60_000;
const FACTOR_CACHE_MAX = 1_000;

const factorCache = new Map<string, { hasVerified: boolean; expiresAt: number }>();

export function clearMfaFactorCache(): void {
  factorCache.clear();
}

export function mfaEnforcementEnabled(): boolean {
  return getEnv().MFA_ENFORCEMENT_ENABLED === "true";
}

/** Auth-surface paths stay reachable so a user can complete the challenge. */
export function isMfaExemptPath(originalUrl: string): boolean {
  return originalUrl.startsWith("/api/v1/auth/");
}

/** Reads the `aal` claim from an already-trusted JWT (no signature check). */
export function decodeAssuranceLevel(token: string): AssuranceLevel | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      aal?: unknown;
    };
    if (payload.aal === "aal2") return "aal2";
    if (payload.aal === "aal1") return "aal1";
    return null;
  } catch {
    return null;
  }
}

/** `true` = has a verified factor, `false` = does not, `null` = unknown. */
export async function userHasVerifiedFactor(userId: string): Promise<boolean | null> {
  const cached = factorCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.hasVerified;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.mfa.listFactors({ userId });
    if (error) {
      logger.warn({ err: error, userId }, "mfa.factor_lookup_failed");
      return null;
    }

    const factors = (data?.factors ?? []) as Array<{ status?: string; factor_type?: string }>;
    const hasVerified = factors.some(
      (factor) => factor.status === "verified" && (factor.factor_type ?? "totp") === "totp",
    );

    if (factorCache.size >= FACTOR_CACHE_MAX) factorCache.clear();
    factorCache.set(userId, { hasVerified, expiresAt: Date.now() + FACTOR_CACHE_TTL_MS });
    return hasVerified;
  } catch (error) {
    logger.warn({ err: error, userId }, "mfa.factor_lookup_error");
    return null;
  }
}

/**
 * Returns `true` when the request must be rejected because the session has not
 * completed a second factor the user has enrolled.
 */
export async function requiresSecondFactor(
  token: string,
  userId: string,
  originalUrl: string,
): Promise<boolean> {
  if (!mfaEnforcementEnabled()) return false;
  if (isMfaExemptPath(originalUrl)) return false;
  if (decodeAssuranceLevel(token) === "aal2") return false;

  const hasVerified = await userHasVerifiedFactor(userId);
  return hasVerified === true;
}
