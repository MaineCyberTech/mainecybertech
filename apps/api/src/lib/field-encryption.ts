/**
 * Field-level encryption for PII at rest (P3-7).
 *
 * Provides AES-256-GCM encryption/decryption for sensitive profile fields
 * (full_name, email, phone, etc.) so they are not stored in plaintext in the
 * database. The key is derived from FIELD_ENCRYPTION_KEY (32-byte hex or
 * base64). In production the key is required: env validation refuses to boot
 * without it and encryptField throws rather than fall back (SEC-P1-001). In development/test only, a missing key falls
 * back to a clearly-marked reversible `plain:` transform so local work still
 * runs; reading a legacy `plain:` value logs a counter but is never silently
 * rewritten.
 *
 * NOTE: This utility is the building block. Applying it to the `profiles`
 * table requires a migration adding an `encrypted_pii jsonb` column plus a
 * backfill + read/write wiring in the profiles route — intentionally left as
 * a follow-up to avoid breaking the live profiles API without full testing.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { getEnv } from "../config/env";
import { logger } from "./logger";

const ALGO = "aes-256-gcm";

function getKey(): Buffer | null {
  const raw = (getEnv() as Record<string, unknown>).FIELD_ENCRYPTION_KEY as string | undefined;
  if (!raw) return null;
  try {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    return Buffer.from(raw, "base64");
  } catch {
    return null;
  }
}

function isProduction(): boolean {
  return (getEnv() as Record<string, unknown>).NODE_ENV === "production";
}

export function encryptField(plaintext: string): string {
  const key = getKey();
  if (!key || key.length !== 32) {
    // SEC-P1-001: never fall back to reversible plaintext in production.
    // getEnv() already refuses to boot prod without a key; this guards direct
    // callers and any future path that bypasses env validation.
    if (isProduction()) {
      throw new Error(
        "FIELD_ENCRYPTION_KEY is required to encrypt PII in production; refusing to store plaintext",
      );
    }
    // Dev/test fallback: not real encryption. Callers must not rely on this in prod.
    return `plain:${plaintext}`;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptField(payload: string): string {
  if (payload.startsWith("plain:")) {
    // Legacy row written by the old dev fallback. Keep reading it (do not
    // rewrite silently) but emit a counter so operators can find and
    // re-encrypt these rows. SEC-P1-001.
    logger.warn(
      { event: "pii_legacy_plaintext" },
      "reading legacy plaintext PII value; re-encryption required",
    );
    return payload.slice("plain:".length);
  }
  if (!payload.startsWith("v1:")) return payload;
  const key = getKey();
  if (!key || key.length !== 32) return payload;
  const [, ivB64, tagB64, encB64] = payload.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const enc = Buffer.from(encB64, "base64");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export function encryptObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "string" ? encryptField(v) : v;
  }
  return out;
}

export function decryptObject(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === "string" ? decryptField(v) : v;
  }
  return out;
}
