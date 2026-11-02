/**
 * AN-P3-006: server-side mirror of the storefront event registry
 * (`apps/web/lib/catalog/data/analytics-events.json`).
 *
 * The public `POST /analytics/track` endpoint used to accept any event name
 * and an unbounded metadata record, so a caller could store arbitrary events
 * (skewing the summary RPC) and park PII inside metadata with no server-side
 * guard. The route now validates the name against this list and sanitises the
 * metadata before insert; `catalog-parity.test.ts` fails CI when the API list
 * drifts from the web registry.
 */
export const ANALYTICS_EVENT_NAMES = [
  "store_view",
  "category_view",
  "product_card_view",
  "product_detail_view",
  "product_cta_click",
  "promo_badge_view",
  "promo_badge_click",
  "quiz_start",
  "quiz_step_complete",
  "quiz_complete",
  "quote_builder_start",
  "quote_item_add",
  "quote_item_remove",
  "quote_submit",
  "campaign_view",
  "campaign_click",
  "comparison_view",
  "proposal_generated_admin",
  "lead_score_updated_admin",
  "portal_service_view",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

/**
 * Privacy rules from the same registry, enforced at the boundary:
 *  - at most 25 metadata keys (the summary RPC groups by event, not metadata);
 *  - scalar values only, stringified and truncated to 200 chars;
 *  - keys that name PII/secret-shaped fields are dropped rather than stored.
 */
export const ANALYTICS_METADATA_MAX_KEYS = 25;
export const ANALYTICS_METADATA_MAX_VALUE_LENGTH = 200;

const FORBIDDEN_METADATA_KEY =
  /(email|e-mail|phone|mobile|address|password|passwd|secret|token|api[_-]?key|ssn|social[_-]?security|dob|birth|card|cvv|iban|ip)/i;

/** Bound + de-PII a metadata object before it is persisted. */
export function sanitizeAnalyticsMetadata(
  input: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!input) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (Object.keys(out).length >= ANALYTICS_METADATA_MAX_KEYS) break;
    if (FORBIDDEN_METADATA_KEY.test(key)) continue;
    if (value === null || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
      continue;
    }
    const raw = typeof value === "string" ? value : (JSON.stringify(value) ?? "");
    out[key] =
      raw.length > ANALYTICS_METADATA_MAX_VALUE_LENGTH
        ? raw.slice(0, ANALYTICS_METADATA_MAX_VALUE_LENGTH)
        : raw;
  }
  return out;
}
