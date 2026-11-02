import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../logger";

/**
 * DATA-P2-006: the worker used to hardcode every retention window while the
 * product's own `retention_policies` registry was never consulted by any purge
 * path. These helpers load the active registry rows and resolve the effective
 * window for a purge target.
 *
 * A policy covers a target when its `system_name` or `data_category` matches
 * one of the target's aliases (case-insensitive, substring match so
 * "Security Audit Logs" covers `audit_logs`). The longest matching window
 * wins: a purge must never delete data earlier than the most permissive
 * policy that covers it.
 */

export interface RetentionPolicyRow {
  system_name: string | null;
  data_category: string | null;
  retention_period_days: number | null;
}

const TARGET_ALIASES: Record<string, readonly string[]> = {
  audit_logs: ["audit_logs", "audit logs", "audit"],
  notifications: ["notifications", "notification"],
  public_interactions: [
    "public_interactions",
    "public interactions",
    "public interaction",
    "contact form",
  ],
  // PRIV-P2-008: public store quote PII (submission + structured request).
  // "store quote" is deliberately not an alias: as a substring it would match
  // a "Store Quote Requests" policy and silently widen the store_quotes window.
  store_quotes: ["store_quotes", "store quotes", "quote submissions"],
  store_quote_requests: [
    "store_quote_requests",
    "store quote requests",
    "store quote request",
    "quote requests",
    "quote request",
  ],
  // WH-P3-009: the webhook delivery log and dead-letter queue.
  webhook_deliveries: ["webhook_deliveries", "webhook deliveries", "webhook delivery"],
  webhook_dead_letters: [
    "webhook_dead_letters",
    "webhook dead letters",
    "webhook dead letter",
    "dead letter",
    "dead letters",
    "dlq",
  ],
};

function matchesTarget(policy: RetentionPolicyRow, target: string): boolean {
  const aliases = TARGET_ALIASES[target] ?? [target];
  const fields = [policy.system_name, policy.data_category]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.toLowerCase());
  return fields.some((field) => aliases.some((alias) => field === alias || field.includes(alias)));
}

export interface ResolvedWindow {
  days: number;
  source: "default" | "policy";
  matchingPolicies: number;
}

/**
 * Resolve the retention window (in days) for a purge target. Non-positive or
 * non-numeric policy windows are ignored (a 0/negative window would set the
 * cutoff to "now" and wipe the table).
 */
export function resolveRetentionDays(
  target: string,
  defaultDays: number,
  policies: readonly RetentionPolicyRow[],
): ResolvedWindow {
  const matching = policies.filter(
    (policy) =>
      typeof policy.retention_period_days === "number" &&
      Number.isFinite(policy.retention_period_days) &&
      policy.retention_period_days > 0 &&
      matchesTarget(policy, target),
  );

  if (matching.length === 0) {
    return { days: defaultDays, source: "default", matchingPolicies: 0 };
  }

  return {
    days: Math.max(...matching.map((policy) => policy.retention_period_days as number)),
    source: "policy",
    matchingPolicies: matching.length,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

/**
 * Load the active rows of `retention_policies`. A registry read failure is
 * logged and degrades to the built-in windows rather than skipping retention
 * entirely (fail-open here only means "keep the previous behaviour"; the
 * failure is visible in the worker logs).
 */
export async function loadActiveRetentionPolicies(
  supabase: AnySupabaseClient,
): Promise<RetentionPolicyRow[]> {
  const { data, error } = await supabase
    .from("retention_policies")
    .select("system_name, data_category, retention_period_days")
    .eq("status", "active");

  if (error) {
    logger.warn(
      { error: error.message },
      "[retention] could not read retention_policies; using built-in windows",
    );
    return [];
  }

  return (data ?? []) as RetentionPolicyRow[];
}
