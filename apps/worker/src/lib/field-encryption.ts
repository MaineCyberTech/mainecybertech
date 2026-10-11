/**
 * Worker-side counterpart of apps/api/src/lib/field-encryption.ts.
 *
 * Outbound webhook signing secrets are encrypted at rest by the API
 * (`v1:` AES-256-GCM payloads). The worker must decrypt them before HMAC
 * signing. Kept in sync with the API helper: same envelope format and
 * FIELD_ENCRYPTION_KEY derivation (64-char hex or base64, 32 bytes).
 *
 * Legacy plaintext values (no `v1:`/`plain:` envelope) decrypt to themselves,
 * so endpoints created before encryption keep signing. This module is
 * intentionally decrypt-only: the worker never writes secrets.
 */
import { createDecipheriv } from "crypto";
import { env } from "../env";
import { logger } from "../logger";

const ALGO = "aes-256-gcm";

function getKey(): Buffer | null {
  const raw = env.FIELD_ENCRYPTION_KEY;
  if (!raw) return null;
  try {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    return Buffer.from(raw, "base64");
  } catch {
    return null;
  }
}

export function decryptField(payload: string): string {
  if (payload.startsWith("plain:")) return payload.slice("plain:".length);
  if (!payload.startsWith("v1:")) return payload;
  const key = getKey();
  if (!key || key.length !== 32) return payload;
  const [, ivB64, tagB64, encB64] = payload.split(":");
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export type SecretDecryptResult = { ok: true; value: string } | { ok: false; error: string };

/**
 * Decrypt a stored secret, reporting failure instead of throwing so callers
 * can fail closed. A `v1:` payload with no configured key is an error, not a
 * pass-through: signing with the ciphertext would produce signatures the
 * receiver cannot verify.
 */
export function decryptSecretValue(payload: string): SecretDecryptResult {
  if (payload.startsWith("v1:") && !getKey()) {
    return { ok: false, error: "FIELD_ENCRYPTION_KEY is not configured" };
  }
  try {
    return { ok: true, value: decryptField(payload) };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error({ err: error }, "failed to decrypt webhook signing secret");
    return { ok: false, error };
  }
}
