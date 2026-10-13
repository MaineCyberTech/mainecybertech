import { getSupabaseAdmin } from "./supabase";
import { logger } from "../lib/logger";
import { toJson } from "../lib/db-types";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 100;

const REDACTED = "[REDACTED]";

/**
 * Generic key names that identify a person only in context (`name`, `title`).
 * Matched exactly (case-insensitive) so entity fields such as `file_name` or
 * `company_name` are not over-redacted.
 */
const PII_EXACT_KEYS = new Set([
  "name",
  "first_name",
  "firstname",
  "middle_name",
  "middlename",
  "last_name",
  "lastname",
  "display_name",
  "displayname",
  "title",
  "job_title",
  "jobtitle",
]);

/**
 * Unambiguous PII tokens, matched anywhere in the key so variants such as
 * `password_hash`, `adminEmail` and `refresh_token` are still caught.
 */
const PII_SUBSTRING_KEYS = [
  "full_name",
  "fullname",
  "email",
  "phone",
  "password",
  "token",
  "secret",
];

function isPiiKey(key: string): boolean {
  const lower = key.toLowerCase();
  return PII_EXACT_KEYS.has(lower) || PII_SUBSTRING_KEYS.some((field) => lower.includes(field));
}

/**
 * Recursively replace values held under PII keys.
 *
 * Audit PRIV-P2-004: the previous filter only inspected top-level keys and
 * missed `name`/`title`/`job_title`, so person names and job titles were
 * stored in `audit_logs.metadata` in plaintext for the full 365-day retention
 * (and exported to any org admin). Scrubbing nested objects/arrays keeps the
 * guarantee while still redacting at the key level. Values that are personal
 * data but sit under a non-PII key (e.g. a free-text message) are not covered
 * by this transform — callers must not log them.
 */
export function redactAuditMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactAuditMetadata(entry));
  }
  if (value !== null && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      // Non-plain objects (Date, Buffer, …) pass through; JSON.stringify at
      // insert time handles them and recursing would destroy their shape.
      return value;
    }
    const scrubbed: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      scrubbed[key] = isPiiKey(key) ? REDACTED : redactAuditMetadata(entry);
    }
    return scrubbed;
  }
  return value;
}

type AuditEventInput = {
  organizationId?: string | null;
  actorUserId?: string | null;
  actorType?: "user" | "system";
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Writes one audit row, retrying transient failures. Returns true when the
 * row was persisted, false when every attempt failed (the failure is logged).
 * Callers that must not silently drop work — e.g. the inbound webhook
 * handlers (RES-P2-007) — check the result and fail the request instead.
 */
export async function logAuditEvent(input: AuditEventInput): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const data = {
    organization_id: input.organizationId ?? null,
    actor_user_id: input.actorUserId ?? null,
    actor_type: input.actorType ?? "user",
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: redactAuditMetadata(input.metadata ?? {}) as Record<string, unknown>,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { error } = await supabase
      .from("audit_logs")
      .insert({ ...data, metadata: toJson(data.metadata) });

    if (!error) return true;

    if (attempt < MAX_RETRIES) {
      logger.warn(
        { err: error, attempt, maxRetries: MAX_RETRIES },
        "audit log insert failed, retrying",
      );
      await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    } else {
      logger.error(
        { err: error, attempt, maxRetries: MAX_RETRIES },
        "audit log insert failed after all retries — audit trail gap",
      );
    }
  }

  return false;
}
