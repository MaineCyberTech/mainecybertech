/**
 * API-key authentication (FEAT-P2-001).
 *
 * `routes/api-keys.ts` mints keys shaped `mct_<64 hex chars>` and stores only
 * their SHA-256 hash (`key_hash`) plus a lookup prefix (`key_prefix` =
 * `mct_` + the first 8 hex chars). Before this middleware nothing ever read
 * `key_hash`, so an `Authorization: Bearer mct_*` request could never
 * authenticate — the advertised machine-credential feature was dead.
 *
 * Resolution is fail-closed:
 *   1. look the key up by its non-secret prefix (indexed, so no full-table scan),
 *   2. constant-time compare the SHA-256 of the presented token with the stored
 *      hash (a plain `===` would leak a timing oracle),
 *   3. reject revoked (`is_active = false`) or expired keys,
 *   4. attach the key's organization + the creating user so the existing
 *      `requireOrgAccess` / `requirePermission` chain still governs what the key
 *      may do, and record `last_used_at` (best effort).
 */
import crypto from "crypto";
import { getSupabaseAdmin } from "../services/supabase";
import { AppError } from "../types";
import { logger } from "../lib/logger";

export const API_KEY_PREFIX = "mct_";

/** Length of the indexed lookup prefix: `mct_` + the first 8 hex chars. */
const PREFIX_LENGTH = API_KEY_PREFIX.length + 8;

export interface ApiKeyAuth {
  id: string;
  /** The user who created the key; the key acts with this user's org permissions. */
  userId: string;
  organizationId: string;
  permissions: string[];
  prefix: string;
}

export function isApiKeyToken(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX);
}

export function apiKeyPrefix(token: string): string {
  return token.slice(0, PREFIX_LENGTH);
}

export function hashApiKey(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison of two hex-encoded digests. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function unauthorized(): AppError {
  return new AppError("UNAUTHORIZED", "Invalid or inactive API key", 401);
}

export async function authenticateApiKey(token: string): Promise<ApiKeyAuth> {
  const prefix = apiKeyPrefix(token);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("api_keys")
    .select(
      "id, organization_id, key_hash, key_prefix, permissions, expires_at, is_active, created_by",
    )
    .eq("key_prefix", prefix)
    .maybeSingle();

  if (error) throw new AppError("DB_ERROR", "API key lookup failed", 500);
  if (!data || !data.is_active) throw unauthorized();
  if (data.expires_at && Date.parse(data.expires_at) <= Date.now()) throw unauthorized();
  if (!timingSafeEqualHex(hashApiKey(token), data.key_hash)) throw unauthorized();

  // Best-effort usage timestamp; a telemetry failure must not fail the request.
  try {
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);
  } catch (err) {
    logger.warn({ err, apiKeyId: data.id }, "Failed to update API key last_used_at");
  }

  return {
    id: data.id,
    userId: data.created_by,
    organizationId: data.organization_id,
    permissions: normalizePermissions(data.permissions),
    prefix: data.key_prefix,
  };
}
