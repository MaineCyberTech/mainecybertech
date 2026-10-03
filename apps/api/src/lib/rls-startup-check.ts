import type { Env } from "../config/env";
import { logger } from "./logger";

/**
 * ARCH-P2-002 — fail closed when the RLS allow-list is empty in production.
 *
 * `getScopedClient` returns the service-role client (RLS bypassed) for any
 * module that is not explicitly listed in `RLS_READS_ENABLED` /
 * `RLS_WRITES_ENABLED`. An empty allow-list therefore means every read and
 * write runs as `service_role` and Postgres RLS is not the enforcement layer.
 *
 * In production we refuse to boot with an empty read allow-list so this
 * defense-in-depth gap cannot be silently re-introduced. Writes are logged
 * loudly but do not block startup: several write paths legitimately need the
 * service-role client (cross-tenant jobs) and the rollout is per-module.
 *
 * See `docs/RLS-rollout.md`.
 */
export function parseAllowList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function assertRlsStartupConfig(
  env: Pick<Env, "NODE_ENV" | "RLS_READS_ENABLED" | "RLS_WRITES_ENABLED">,
): void {
  const reads = parseAllowList(env.RLS_READS_ENABLED);
  const writes = parseAllowList(env.RLS_WRITES_ENABLED);

  if (env.NODE_ENV !== "production") {
    logger.info(
      { rlsReadModules: reads.length, rlsWriteModules: writes.length },
      "RLS allow-list status (non-production; service-role remains the fallback)",
    );
    return;
  }

  if (reads.length === 0) {
    throw new Error(
      "RLS_READS_ENABLED is empty in production: every read would fall back to the " +
        "service-role client and bypass Row Level Security. Set RLS_READS_ENABLED " +
        "(see docs/RLS-rollout.md) or run with NODE_ENV!=production. Refusing to start.",
    );
  }

  if (writes.length === 0) {
    logger.error(
      "RLS_WRITES_ENABLED is empty in production: every write falls back to the " +
        "service-role client and bypasses Row Level Security. See docs/RLS-rollout.md.",
    );
  }
}
