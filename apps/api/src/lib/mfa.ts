/**
 * MFA (aal2) enforcement.
 *
 * The portal delegates identity to hosted Supabase, so factors live in GoTrue's
 * `auth.mfa_factors`. Broad enforcement is **opt-in** via
 * `MFA_ENFORCEMENT_ENABLED`, but `admin`/`super_admin` sessions are always
 * enforced (SEC-P2-005): the highest-privilege accounts must not operate with
 * password-only `aal1` sessions merely because the deploy flag is unset. Both
 * paths only ever block a user who has a *verified* factor but an `aal1`
 * session — so turning enforcement on can never lock out users who have not
 * enrolled.
 *
 * The factor lookup is cached briefly and fails open on a GoTrue error: a
 * control-plane hiccup must not take the whole API down for MFA users. The
 * failure is logged so the gap is visible.
 */
import { getEnv } from "../config/env";
import { getSupabaseAdmin } from "../services/supabase";
import { logger } from "./logger";
import { ADMIN_BYPASS_KEYS } from "./permissions";
import { roleKeyOf } from "./roles";

export type AssuranceLevel = "aal1" | "aal2";

const FACTOR_CACHE_TTL_MS = 60_000;
const FACTOR_CACHE_MAX = 1_000;

const factorCache = new Map<string, { hasVerified: boolean; expiresAt: number }>();
const privilegedCache = new Map<string, { privileged: boolean; expiresAt: number }>();

export function clearMfaFactorCache(): void {
  factorCache.clear();
  privilegedCache.clear();
}

export function mfaEnforcementEnabled(): boolean {
  return getEnv().MFA_ENFORCEMENT_ENABLED === "true";
}

/**
 * SEC-P2-005: `true` when the user holds a privileged role — an approved
 * membership with an `admin`/`super_admin` role key in any org, or the
 * `is_super_admin` profile flag. Cached like the factor lookup; a lookup
 * failure returns `false` (the caller falls back to the opt-in flag, so a
 * control-plane blip degrades to the old behavior rather than locking anyone
 * out).
 */
export async function userHasPrivilegedRole(userId: string): Promise<boolean> {
  const cached = privilegedCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.privileged;

  try {
    const supabase = getSupabaseAdmin();
    const [{ data: profile }, { data: memberships }] = await Promise.all([
      supabase.from("profiles").select("is_super_admin").eq("id", userId).maybeSingle(),
      supabase
        .from("memberships")
        .select("roles!inner(key)")
        .eq("user_id", userId)
        .eq("status", "approved"),
    ]);

    const privileged =
      (profile as { is_super_admin?: boolean } | null)?.is_super_admin === true ||
      (memberships ?? []).some((row) => {
        const key = roleKeyOf((row as { roles?: unknown }).roles);
        return key != null && (ADMIN_BYPASS_KEYS as readonly string[]).includes(key);
      });

    if (privilegedCache.size >= FACTOR_CACHE_MAX) privilegedCache.clear();
    privilegedCache.set(userId, {
      privileged,
      expiresAt: Date.now() + FACTOR_CACHE_TTL_MS,
    });
    return privileged;
  } catch (error) {
    logger.warn({ err: error, userId }, "mfa.privileged_role_lookup_error");
    return false;
  }
}

/** Auth-surface paths stay reachable so a user can complete the challenge. */
export function isMfaExemptPath(originalUrl: string | undefined): boolean {
  return (originalUrl ?? "").startsWith("/api/v1/auth/");
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
 *
 * Only a user with a *verified* factor can ever be required to step up (so
 * nobody without a factor is ever locked out). Among those users, broad
 * enforcement is the `MFA_ENFORCEMENT_ENABLED` opt-in, while privileged
 * (admin/super_admin) sessions are enforced unconditionally (SEC-P2-005) so a
 * password-only session can never act with platform-admin authority.
 */
export async function requiresSecondFactor(
  token: string,
  userId: string,
  originalUrl: string,
): Promise<boolean> {
  if (isMfaExemptPath(originalUrl)) return false;
  if (decodeAssuranceLevel(token) === "aal2") return false;

  const hasVerified = await userHasVerifiedFactor(userId);
  if (hasVerified !== true) return false;

  return mfaEnforcementEnabled() || (await userHasPrivilegedRole(userId));
}
