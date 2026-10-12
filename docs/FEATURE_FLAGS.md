# Feature Flags

Feature flags live in `apps/api/src/lib/feature-flags.ts`. The registry is
typed: every flag is declared in `FEATURE_FLAGS` with a description, a default
and an owning team, and `isFeatureEnabled` throws for an unknown key instead of
silently returning `false`.

## Registered flags

| Key | Default | Owner | Description |
| --- | --- | --- | --- |
| `new-onboarding` | `false` | `@api` | New client onboarding flow |
| `bulk-export-v2` | `false` | `@api` | V2 bulk export pipeline |
| `sse-notifications` | `true` | `@api` | Server-sent-event notification stream |
| `store-catalog` | `true` | `@web` | Storefront catalog pages |

Adding or removing a flag is a code change (registry entry) plus, when a
consumer exists, the call site `isFeatureEnabled(key, { organizationId })`.

## Resolution precedence

First match wins:

1. **Runtime override** — `setFeatureFlagOverride(key, enabled, { actorUserId, organizationId, reason })`.
2. **Global env override** — `FEATURE_<KEY>` (`true`/`1` enables, `false`/`0` disables).
3. **Per-org allow-list** — `FEATURE_<KEY>_ORGS` (comma-separated organization ids).
   Requires an organization context; listed orgs get `true`, everyone else `false`.
4. **Percentage rollout** — `FEATURE_<KEY>_PERCENT` (0–100), bucketed
   deterministically by `hash(key:orgId) % 100`. Requires an organization context.
5. **Registry default**.

Key names are upper-cased with `-` → `_`: `new-onboarding` →
`FEATURE_NEW_ONBOARDING`, `FEATURE_NEW_ONBOARDING_ORGS`,
`FEATURE_NEW_ONBOARDING_PERCENT`.

## Change log

Every runtime override change appends to the in-process change log
(`getFeatureFlagChangeLog()`) and writes an audit event
(`feature_flag.changed` on `audit_logs`, with the previous/next value, reason
and actor). Deploy-time env changes are recorded by the deploy pipeline, not by
this module.

## Scope and residual

Runtime overrides are **process-local** and reset on restart — this is the
bounded step the EVOL-P3-001 remediation asked for (typed registry + targeting
+ change log + audit event). A managed flag service (persistent table, admin UI,
cross-instance propagation) remains a follow-up; the resolution API
(`isFeatureEnabled` / `getFeatureFlags` / `setFeatureFlagOverride`) is the seam
that service can replace without touching call sites.

Tests: `apps/api/src/__tests__/feature-flags.test.ts` covers precedence,
targeting, unknown keys and the audit event.
