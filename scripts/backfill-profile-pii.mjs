/**
 * Backfill profiles.encrypted_pii (P3-7).
 *
 * One-time, idempotent, additive. Reads plaintext PII columns (full_name,
 * email, phone, title) from the `profiles` table and writes an encrypted JSON
 * copy into `encrypted_pii`. Plaintext columns are NEVER modified, so existing
 * API reads are unaffected (non-breaking).
 *
 * Encryption format is identical to apps/api/src/lib/field-encryption.ts so
 * the API can decrypt these rows at runtime: `v1:<ivB64>:<tagB64>:<encB64>`.
 *
 * Run inside the api container (which has @supabase/supabase-js):
 *   docker run --rm --env-file /opt/mct-portal/.env \
 *     -v /opt/mct-portal/repo/scripts:/scripts \
 *     ghcr.io/mainecybertech/mct-api:latest node /scripts/backfill-profile-pii.mjs
 *
 * Refuses to run (exit 1) if FIELD_ENCRYPTION_KEY is missing/not 32 bytes, so
 * it never writes the dev `plain:` fallback into production data.
 */
import { createClient } from "@supabase/supabase-js";
import { createCipheriv, randomBytes } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIELD_ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

function deriveKey(raw) {
  if (!raw) return null;
  try {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    return Buffer.from(raw, "base64");
  } catch {
    return null;
  }
}

const KEY = deriveKey(FIELD_ENCRYPTION_KEY);
if (!KEY || KEY.length !== 32) {
  console.error(
    "FIELD_ENCRYPTION_KEY must be a 32-byte value (64-char hex or base64). Refusing to run to avoid writing plaintext fallback into production.",
  );
  process.exit(1);
}

const ALGO = "aes-256-gcm";
const PII_FIELDS = ["full_name", "email", "phone", "title"];

function encryptField(plaintext) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

function encryptProfilePii(row) {
  const out = {};
  for (const field of PII_FIELDS) {
    const value = row[field];
    if (value !== undefined && value !== null) {
      out[field] = encryptField(value);
    }
  }
  return out;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BATCH = 200;
let processed = 0;
let encrypted = 0;
let skipped = 0;
let cursor = null;
let page = 0;

async function main() {
  for (;;) {
    page += 1;
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, phone, title, encrypted_pii")
      .is("encrypted_pii", null)
      .order("id")
      .limit(BATCH);

    if (cursor !== null) query = query.gt("id", cursor);

    const { data, error } = await query;
    if (error) {
      console.error("Select failed:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      const payload = encryptProfilePii(row);
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ encrypted_pii: payload })
        .eq("id", row.id);
      if (updErr) {
        console.error(`Update failed for id=${row.id}:`, updErr.message);
        process.exit(1);
      }
      processed += 1;
      if (Object.keys(payload).length > 0) encrypted += 1;
      else skipped += 1;
    }

    cursor = data[data.length - 1].id;
    if (data.length < BATCH) break;
    if (page > 100000) {
      console.error("Safety: exceeded page limit");
      process.exit(1);
    }
  }

  console.log(
    `Backfill complete. processed=${processed} encrypted=${encrypted} empty-skipped=${skipped}`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
