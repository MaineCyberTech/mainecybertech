/**
 * Field-level encryption for PII at rest (P3-7).
 *
 * Provides AES-256-GCM encryption/decryption for sensitive profile fields
 * (full_name, email, phone, etc.) so they are not stored in plaintext in the
 * database. The key is derived from MCT_FIELD_ENCRYPTION_KEY (32-byte hex or
 * base64). When the key is absent (e.g. local dev without the secret), the
 * functions fall back to a clearly-marked reversible transform so the app
 * still runs, but callers should treat unencrypted storage as non-production.
 *
 * NOTE: This utility is the building block. Applying it to the `profiles`
 * table requires a migration adding an `encrypted_pii jsonb` column plus a
 * backfill + read/write wiring in the profiles route — intentionally left as
 * a follow-up to avoid breaking the live profiles API without full testing.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { getEnv } from "../config/env";

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

export function encryptField(plaintext: string): string {
  const key = getKey();
  if (!key || key.length !== 32) {
    // Dev fallback: not real encryption. Callers must not rely on this in prod.
    return `plain:${plaintext}`;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptField(payload: string): string {
  if (payload.startsWith("plain:")) return payload.slice("plain:".length);
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
