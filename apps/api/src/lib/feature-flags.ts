/**
 * Feature flag registry (EVOL-P3-001).
 *
 * The previous implementation was an untyped `Record<string, boolean>` with
 * zero consumers, no targeting and no change log. This module keeps the
 * deployment-friendly env override model but adds the missing structure:
 *
 *  - a **typed registry** (`FEATURE_FLAGS`) with description, default and
 *    owning team per key, so a flag cannot be referenced by a typo and the
 *    lifecycle is reviewable;
 *  - **targeting**: global env override (`FEATURE_<KEY>`), per-organization
 *    allow-list (`FEATURE_<KEY>_ORGS`, comma-separated org ids) and a
 *    deterministic percentage rollout (`FEATURE_<KEY>_PERCENT`, 0-100);
 *  - a **change log** (`getFeatureFlagChangeLog`) plus an audit event
 *    (`feature_flag.changed`) every time a runtime override changes a value.
 *
 * Resolution precedence (first match wins):
 *   1. runtime override set via `setFeatureFlagOverride`
 *   2. `FEATURE_<KEY>` global env override
 *   3. `FEATURE_<KEY>_ORGS` allow-list (when an org context is supplied)
 *   4. `FEATURE_<KEY>_PERCENT` deterministic rollout (requires org context)
 *   5. registry default
 *
 * Runtime overrides are process-local and intentionally bounded: they are the
 * change-logged seam a managed flag service (persistent store + admin UI) can
 * replace later without touching call sites. Deploy-time env changes are
 * recorded by the deploy pipeline, not here. See docs/FEATURE_FLAGS.md.
 */
import { logger } from "./logger";
import { logAuditEvent } from "../services/audit";

export interface FeatureFlagDefinition {
  /** What the flag controls; shown in docs and change-log entries. */
  description: string;
  /** Value when no override or targeting rule applies. */
  default: boolean;
  /** Owning team for lifecycle review. */
  owner: string;
}

/**
 * The registry. Adding/removing a flag is a code change by design — every key
 * must be declared here before `isFeatureEnabled` can reference it.
 */
export const FEATURE_FLAGS = {
  "new-onboarding": {
    description: "New client onboarding flow",
    default: false,
    owner: "@api",
  },
  "bulk-export-v2": {
    description: "V2 bulk export pipeline",
    default: false,
    owner: "@api",
  },
  "sse-notifications": {
    description: "Server-sent-event notification stream",
    default: true,
    owner: "@api",
  },
  "store-catalog": {
    description: "Storefront catalog pages",
    default: true,
    owner: "@web",
  },
} as const satisfies Record<string, FeatureFlagDefinition>;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export const FEATURE_FLAG_KEYS = Object.keys(FEATURE_FLAGS) as FeatureFlagKey[];

export interface FeatureFlagContext {
  /** Organization id for per-org targeting rules. */
  organizationId?: string | null;
}

export interface FeatureFlagChange {
  key: FeatureFlagKey;
  previous: boolean | undefined;
  next: boolean | undefined;
  /** "override" (runtime set) or "clear" (override removed). */
  source: "override" | "clear";
  actorUserId?: string | null;
  organizationId?: string | null;
  reason?: string;
  changedAt: string;
}

const ENV_PREFIX = "FEATURE_";

function envKey(key: string): string {
  return `${ENV_PREFIX}${key.toUpperCase().replace(/-/g, "_")}`;
}

function parseBoolean(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return undefined;
}

function parseList(raw: string | undefined): string[] | undefined {
  if (raw === undefined) return undefined;
  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

/** Deterministic 0-99 bucket for a flag/org pair (percentage rollouts). */
export function featureFlagBucket(key: FeatureFlagKey, organizationId: string): number {
  let hash = 0x811c9dc5;
  const input = `${key}:${organizationId}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % 100;
}

const overrides = new Map<FeatureFlagKey, boolean>();
const changeLog: FeatureFlagChange[] = [];

/** True when `key` is a registered flag. */
export function isFeatureFlagKey(key: string): key is FeatureFlagKey {
  return Object.prototype.hasOwnProperty.call(FEATURE_FLAGS, key);
}

/**
 * Resolve one flag. Unknown keys throw: the registry is the type system for
 * flag names, so a typo should fail loudly instead of silently returning the
 * default (the old implementation returned `false` for every unknown key).
 */
export function isFeatureEnabled(key: FeatureFlagKey, context: FeatureFlagContext = {}): boolean {
  if (!isFeatureFlagKey(key)) {
    throw new Error(`Unknown feature flag "${String(key)}" — add it to FEATURE_FLAGS`);
  }

  const override = overrides.get(key);
  if (override !== undefined) return override;

  const globalEnv = parseBoolean(process.env[envKey(key)]);
  if (globalEnv !== undefined) return globalEnv;

  const orgId = context.organizationId ?? undefined;
  if (orgId) {
    const allowList = parseList(process.env[`${envKey(key)}_ORGS`]);
    if (allowList) return allowList.includes(orgId);

    const percentRaw = process.env[`${envKey(key)}_PERCENT`];
    const percent = percentRaw === undefined ? undefined : Number(percentRaw);
    if (percent !== undefined && Number.isFinite(percent)) {
      const bounded = Math.min(100, Math.max(0, percent));
      return featureFlagBucket(key, orgId) < bounded;
    }
  }

  return FEATURE_FLAGS[key].default;
}

/** Resolve every registered flag for a context. */
export function getFeatureFlags(context: FeatureFlagContext = {}): Record<FeatureFlagKey, boolean> {
  const flags = {} as Record<FeatureFlagKey, boolean>;
  for (const key of FEATURE_FLAG_KEYS) {
    flags[key] = isFeatureEnabled(key, context);
  }
  return flags;
}

/**
 * Set a runtime override and record the change. Returns the change entry.
 * `logAuditEvent` is awaited so callers know the audit row was attempted;
 * the in-memory override and change log are updated regardless.
 */
export async function setFeatureFlagOverride(
  key: FeatureFlagKey,
  enabled: boolean,
  options: { actorUserId?: string | null; organizationId?: string | null; reason?: string } = {},
): Promise<FeatureFlagChange> {
  if (!isFeatureFlagKey(key)) {
    throw new Error(`Unknown feature flag "${String(key)}" — add it to FEATURE_FLAGS`);
  }
  const previous = overrides.get(key);
  overrides.set(key, enabled);
  const change: FeatureFlagChange = {
    key,
    previous,
    next: enabled,
    source: "override",
    actorUserId: options.actorUserId ?? null,
    organizationId: options.organizationId ?? null,
    reason: options.reason,
    changedAt: new Date().toISOString(),
  };
  changeLog.push(change);
  logger.info(
    { flag: key, previous, next: enabled, actorUserId: change.actorUserId, reason: change.reason },
    "feature flag override changed",
  );
  await logAuditEvent({
    organizationId: change.organizationId,
    actorUserId: change.actorUserId,
    action: "feature_flag.changed",
    entityType: "feature_flag",
    entityId: key,
    metadata: {
      previous: previous ?? null,
      next: enabled,
      reason: change.reason ?? null,
      description: FEATURE_FLAGS[key].description,
    },
  });
  return change;
}

/** Remove a runtime override, restoring env/default resolution. */
export async function clearFeatureFlagOverride(
  key: FeatureFlagKey,
  options: { actorUserId?: string | null; organizationId?: string | null; reason?: string } = {},
): Promise<FeatureFlagChange> {
  const previous = overrides.get(key);
  overrides.delete(key);
  const change: FeatureFlagChange = {
    key,
    previous,
    next: undefined,
    source: "clear",
    actorUserId: options.actorUserId ?? null,
    organizationId: options.organizationId ?? null,
    reason: options.reason,
    changedAt: new Date().toISOString(),
  };
  changeLog.push(change);
  await logAuditEvent({
    organizationId: change.organizationId,
    actorUserId: change.actorUserId,
    action: "feature_flag.changed",
    entityType: "feature_flag",
    entityId: key,
    metadata: { previous: previous ?? null, next: null, reason: change.reason ?? null },
  });
  return change;
}

/** Ordered change log (oldest first); a copy, so callers cannot mutate it. */
export function getFeatureFlagChangeLog(): FeatureFlagChange[] {
  return changeLog.map((entry) => ({ ...entry }));
}

/** Test helper: drop all runtime state. */
export function resetFeatureFlagStateForTests(): void {
  overrides.clear();
  changeLog.length = 0;
}
