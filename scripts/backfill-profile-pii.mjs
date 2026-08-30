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
 * This script intentionally uses ONLY Node built-ins (global fetch + crypto)
 * so it can run inside the api container or any Node 18+ image without
 * installing @supabase/supabase-js. It talks to the Supabase REST API directly
 * using the service-role key (which bypasses RLS).
 *
 * Run (pipes the script into the api container, reading creds from /opt/mct-portal/.env):
 *   Get-Content scripts/backfill-profile-pii.mjs | ssh root@droplet \
 *     "docker run --rm --entrypoint node --env-file /opt/mct-portal/.env -i \
 *      ghcr.io/mainecybertech/mainecybertech/mct-api:<tag> --input-type=module -"
 *
 * Refuses to run (exit 1) if FIELD_ENCRYPTION_KEY is missing/not 32 bytes, so
 * it never writes the dev `plain:` fallback into production data.
 */
import { createCipheriv, randomBytes } from "crypto";

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
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

const headers = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  Accept: "application/json",
};

async function fetchPage(offset) {
  // No encrypted_pii filter here: we fetch all rows and decide in-process so we
  // correctly handle both NULL and already-empty '{}' rows (the column may have
  // been created with a default), while skipping rows already backfilled.
  const url = `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,email,phone,title,encrypted_pii&order=id&limit=200&offset=${offset}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GET profiles failed ${res.status}: ${body}`);
  }
  return res.json();
}

async function updateRow(id, payload) {
  const url = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ encrypted_pii: payload }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PATCH profile ${id} failed ${res.status}: ${body}`);
  }
}

async function main() {
let offset = 0;
let processed = 0;
let encrypted = 0;
let skipped = 0;
let already = 0;
let iterations = 0;

  for (;;) {
    iterations += 1;
    if (iterations > 100000) {
      console.error("Safety: exceeded page limit");
      process.exit(1);
    }
    const rows = await fetchPage(offset);
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const row of rows) {
      const existing = row.encrypted_pii;
      const alreadyDone =
        existing && typeof existing === "object" && Object.keys(existing).length > 0;
      if (alreadyDone) {
        processed += 1;
        already += 1;
        continue;
      }
      const payload = encryptProfilePii(row);
      await updateRow(row.id, payload);
      processed += 1;
      if (Object.keys(payload).length > 0) encrypted += 1;
      else skipped += 1;
    }

    if (rows.length < 200) break;
    offset += 200;
  }

  console.log(
    `Backfill complete. processed=${processed} encrypted=${encrypted} empty-skipped=${skipped} already-done=${already}`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
