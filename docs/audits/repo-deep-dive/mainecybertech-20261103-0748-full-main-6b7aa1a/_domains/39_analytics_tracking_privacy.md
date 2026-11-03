# Analytics, Tracking and Privacy — re-audit verification

## Audit Metadata

- Audit name: repo-deep-dive (full-domain verification re-audit)
- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Repository: `MaineCyberTech/mainecybertech`
- Branch / Commit: `origin/main` @ `6b7aa1a5505d4f75b334b36e9e87737cd98e589c`
- Generated at: 2026-11-03 (UTC)
- Auditor: subagent (re-audit of `mainecybertech-20261014-0033-full-main-7dd0402`)
- Area code: AN
- Scope limitations: read-only static review; no GA/Tawk.to traffic, no live analytics inserts, no Sentry project inspection.

## Scope

Re-verified all 11 previous AN findings at `6b7aa1a`: third-party consent gating, first-party event capture, IP/UA handling, retention/purge, visitor-alert consent and geo transport, consent-mode/governance docs, anonymous insert closure, consent recording, error-telemetry scrubbing, Tawk.to withdrawal, and the analytics event/metadata contract. The diff added the server-side event allowlist/metadata sanitiser and the Tawk.to shutdown path.

## Inventory

| Item | Path / symbol | Purpose | Current state | Risk | Notes |
|---|---|---|---|---|---|
| Consent provider | `components/consent/ConsentProvider.tsx` | Default-deny stored choice | Working | Low | `mct-consent-v1` |
| GA/Tawk loader | `components/consent/AnalyticsScripts.tsx` | Consent-gated third parties | Working | Low | Withdrawal shuts Tawk down |
| First-party tracker | `lib/catalog/analytics.ts` | Storefront events | Working | Low | CSRF bootstrap/retry |
| Track API | `routes/analytics.ts` | Public ingestion | Working | Low | Event enum + sanitiser |
| Event registry | `lib/analytics-events.ts`, `apps/web/.../analytics-events.json` | Event names/rules | Working | Low | Parity test |
| Summary RPC | `5302440` | Aggregate counts | Working | Low | Service-role only |
| Retention | `worker/tasks/retention.ts` | 90-day purge | Working | Low | Not registry-driven |
| Visitor alert | `routes/public.ts` | Teams lead card | Working | Low | Consent-gated; no IP |
| Error telemetry | `api/web/worker sentry-scrub.ts` | PII scrub | Working | Low | `sendDefaultPii:false` |
| Governance docs | `docs/ANALYTICS_GOVERNANCE.md`, `docs/PRIVACY.md` | Consent/retention policy | Partial | Low | One stale sentence |

## Domain scorecard

| Category | Score | Evidence | Gap | Recommended action |
|---|---:|---|---|---|
| Analytics scripts | 5 | Granted-only injection | — | — |
| Tracking pixels | 3 | None found besides GA/Tawk | No pixel inventory | Document "none" |
| Events | 4 | 20-name registry, 5 live | Many reserved | Keep registry updated |
| Product analytics | 4 | Admin store analytics page + summary RPC | Summary only | Keep |
| Error telemetry | 4 | beforeSend scrub | Free-text values unscanned | Caller discipline |
| Session replay | 0 | Absent | N/A | Future readiness |
| Cookie banner | 5 | Default deny + settings | — | — |
| Consent | 4 | Server record + Consent Mode | Anon quote path is PRIV domain | — |
| Opt-in/out | 4 | Withdrawal signalling/shutdown | Re-grant needs reload | Document |
| User/tenant ids | 3 | Anonymous id only | No tenant analytics | Intentional |
| Sensitive payloads | 3 | Key filter + bounds | Values not scanned | AN-P3-006 |
| Retention | 3 | 90-day purge | Registry ignored | AN-P3-007 |
| Vendor list | 4 | SUBPROCESSORS + governance doc | DPAs unverified | Operator |
| Do-not-track | 1 | Not implemented/honoured | Browser DNT ignored | Future |

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| `apps/web/components/consent/ConsentProvider.tsx`, `AnalyticsScripts.tsx` | Read | Consent gate + withdrawal | Default deny; GA consent mode; Tawk shutdown |
| `apps/web/app/(public)/layout.tsx` | Read | Script wiring | ConsentProvider + AnalyticsScripts |
| `apps/api/src/routes/analytics.ts`, `lib/analytics-events.ts` | Read | Track endpoint + registry | Event enum, metadata sanitiser |
| `apps/web/lib/catalog/analytics.ts`, `components/store/*` | Read | First-party capture | CSRF bootstrap/retry, actual callers |
| `apps/api/src/routes/public.ts` | Read | Visitor init/alert/geo | Consent-gated IP/UA/geo |
| `apps/worker/src/tasks/retention.ts`, `lib/retention-policy.ts` | Read | Analytics purge | 90-day bounded purge |
| `supabase/migrations/5302446`, `5302458`, `5302440` | Read | PII columns/anon closure/RPC | Columns dropped; anon insert revoked |
| `apps/api/src/lib/sentry-scrub.ts`, `apps/web/lib/sentry-scrub.ts` | Read | Error telemetry PII | Key-based scrub + `sendDefaultPii:false` |
| `docs/ANALYTICS_GOVERNANCE.md`, `docs/PRIVACY.md`, `docs/modules/analytics.md` | Read | Governance/retention | One stale withdrawal sentence |
| `apps/api/src/__tests__/analytics.test.ts`, `catalog-parity.test.ts` | Read | Contract coverage | Event allowlist/parity |

## Verification Performed

| Evidence | Type | Why relevant | Notes |
|---|---|---|---|
| Track route walk | Read | Event/metadata controls | `z.enum` + sanitizer |
| Metadata sanitizer read | Read | PII keys/bounds | Keys only; values not scanned |
| Storefront caller inventory | Read | Is capture live? | 5 events fired by 3 components |
| Retention task read | Read | Purge path/window | Uses hardcoded default |
| Consent effect read | Read | Withdrawal behaviour | GA update + Tawk shutdown |
| No live vendor traffic | Not run | Cannot observe GA/Tawk/Sentry requests | Documented limitation |

## Executive Summary

10 of 11 previous AN findings are **verified fixed**; `AN-P3-006` is **partially fixed**; 0 regressed.

- `AN-P3-005` closed: withdrawing consent now calls `Tawk_API.hideWidget()` and `Tawk_API.shutdown()` immediately in addition to the GA Consent Mode denial (`AnalyticsScripts.tsx:32-57,78-84`); the executed script tag still only unloads on reload, which `docs/PRIVACY.md:118-121` now states.
- `AN-P3-006` partially closed: the track endpoint now rejects event names outside the server registry and bounds metadata (25 keys, 200-char values, PII-named keys dropped). Residual: metadata **values** are not pattern-scanned and keys are not restricted to a per-event allowlist, so `{"note":"john@example.com"}` still persists; the web registry's free-text privacy rule remains prose-only.
- Two **new P3 findings**: store-analytics retention is the only purge target that ignores the `retention_policies` registry (`AN-P3-007`), and the analytics governance doc still describes the old "Tawk.to stops on next page load" behaviour (`AN-P3-008`).

## Findings

| ID | Sev | Status | Title |
|---|---|---|---|
| AN-P2-001 | P2 | verified-fixed | Google Analytics and Tawk.to load on public pages with no cookie-consent or opt-out gate |
| AN-P2-002 | P2 | verified-fixed | Analytics API stores visitor IP and user-agent in plaintext despite the documented no-PII contract |
| AN-P2-003 | P2 | verified-fixed | Storefront analytics capture is dead: the browser helper is never called and cannot pass the CSRF gate |
| AN-P2-004 | P2 | verified-fixed | First-party analytics events have no retention or purge path |
| AN-P2-005 | P2 | verified-fixed | Visitor-alert tracking collects IP/geo before consent and sends the visitor IP to ip-api.com over plaintext HTTP |
| AN-P3-001 | P3 | verified-fixed | Analytics has no consent-mode signalling and no documented event/retention governance |
| AN-P3-002 | P3 | verified-fixed | Anonymous direct inserts to store_analytics_events bypass API validation, rate limits, and retention |
| AN-P3-003 | P3 | verified-fixed | Consent is not recorded and the privacy policy omits first-party tracking stores and opt-out mechanics |
| AN-P3-004 | P3 | verified-fixed | Error telemetry has no explicit PII scrubbing, retention, or vendor disclosure |
| AN-P3-005 | P3 | verified-fixed | Consent withdrawal does not unload Tawk.to; the widget keeps running until the next page load |
| AN-P3-006 | P3 | partially-fixed | Analytics track endpoint accepts arbitrary event names and unbounded metadata; the event registry's privacy rules are not enforced server-side |
| AN-P3-007 | P3 | open | store_analytics_events is the only purge target that ignores the retention_policies registry |
| AN-P3-008 | P3 | open | Analytics governance doc still says Tawk.to stops only on the next page load |

Counts (all 13 findings in this report): **10 verified-fixed, 1 partially-fixed, 0 regressed, 2 new P3 open.**

## Key fix verified in this diff

### AN-P3-005 — Tawk.to shutdown on consent withdrawal

`AnalyticsScripts.tsx:32-57` defines `signalTawkWithdrawal()` and calls `hideWidget()` + `shutdown()` (guarded by try/catch); the effect at `:78-84` runs it whenever `choice === "denied"`. `docs/PRIVACY.md:118-121` documents that the widget stops immediately while the script tag remains loaded until reload. The GA withdrawal path still pushes a denied Consent Mode update.

### AN-P3-006 — registry enforcement (partial)

`routes/analytics.ts:15-27` validates `event` against `ANALYTICS_EVENT_NAMES` (`lib/analytics-events.ts:16-31`) and `:55` sanitises metadata through `sanitizeAnalyticsMetadata` (`:33-69`): 25-key cap, 200-char values, PII-named keys dropped. `catalog-parity.test.ts` guards name drift. Residual: value content is not scanned and keys are not bound to a per-event schema.

## New findings

### AN-P3-007 — analytics retention bypasses the policy registry (P3, open)

- **Evidence:** `apps/worker/src/tasks/retention.ts:168-170` computes the cutoff from `config.storeAnalyticsRetentionDays` (default 90 at `:27`) and never calls `resolveRetentionDays`; `TARGET_ALIASES` in `lib/retention-policy.ts:30-44` has no `store_analytics_events` entry, while audit/notifications/quote/webhook targets resolve registry windows.
- **Why it matters:** a tenant/admin `retention_policies` row cannot govern analytics retention, and the governance table documents only the worker constant. Low impact because the store is anonymous, but inconsistent with `DATA-P2-006`.
- **Recommended fix:** add the target alias and resolve the window like the other purge targets.
- **Validation:** seed a policy row for `store_analytics_events` and assert the cutoff uses it.
- **Owner:** worker/data platform · **Effort:** S · **Target:** next quarter.

### AN-P3-008 — governance doc contradicts the new withdrawal behaviour (P3, open)

- **Evidence:** `docs/ANALYTICS_GOVERNANCE.md:18` still says Tawk.to/GA "stop collecting on the next page load" and that already-loaded scripts cannot be unloaded mid-page; the code now shuts Tawk down immediately (`AnalyticsScripts.tsx:32-57,78-84`) and `docs/PRIVACY.md:118-121` says so.
- **Why it matters:** operators and DSAR/incident reviewers get the wrong consent/withdrawal story; the doc understates the implemented control.
- **Recommended fix:** update §1 of the governance doc to match PRIVACY.md and the code.
- **Validation:** doc review; no test currently guards this sentence.
- **Owner:** web/data governance · **Effort:** S · **Target:** next quarter.

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|---|---|---|---|---|---|
| PII parked in metadata values | P3 | Medium (public endpoint) | Analytics store holds personal data | AN-P3-006 | Value scanning + per-event key allowlist |
| Policy registry ignored for analytics | P3 | Low | Wrong retention after policy change | AN-P3-007 | Resolve via registry |
| Stale withdrawal doc | P3 | Low | Wrong compliance narrative | AN-P3-008 | Doc update |
| GA/Tawk vendor retention unverified | P3 | Unknown | Vendor-side retention | docs/SUBPROCESSORS.md | Operator console check |

## Recommendations

### Immediate / Release Blocking

None.

### This Month

1. Add value-level PII scanning or a per-event key allowlist to the analytics track endpoint (`AN-P3-006` residual).
2. Add `store_analytics_events` to the retention-policy resolver (`AN-P3-007`).

### Later

3. Update `docs/ANALYTICS_GOVERNANCE.md` §1 (`AN-P3-008`) and add a doc/test guard for the withdrawal description.

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|---|---|---|---|
| Value regex for email/phone | Stops obvious PII in metadata | `lib/analytics-events.ts` | Unit test |
| Add alias entry | Registry-driven analytics retention | `lib/retention-policy.ts`, `retention.ts` | Retention test |
| Fix one doc line | Accurate consent narrative | `docs/ANALYTICS_GOVERNANCE.md` | Review |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|---|---|---|---|---|
| Value-level PII scan / per-event key allowlist (AN-P3-006) | P3 | API/web | M | Product metadata spec |
| Registry-driven analytics retention (AN-P3-007) | P3 | worker/data platform | S | None |
| Update governance withdrawal row (AN-P3-008) | P3 | web/data governance | S | None |
| DNT/opt-out documentation | P3 | web/governance | S | Product decision |

## Suggested Tests

- Track: unknown event → 400; >25 keys → capped; PII-named key dropped; email-looking value under `note` is rejected/redacted (currently fails).
- Consent: denied → no GA/Tawk script; withdrawal → `Tawk_API.shutdown` called; re-grant after withdrawal (documented limitation).
- Retention: policy row overrides default for `store_analytics_events` (currently fails).
- Anonymous insert: `anon` cannot INSERT into `store_analytics_events` (migration guard).
- Sentry: `beforeSend` removes cookies/user email/ip.

## Suggested Documentation Updates

- `docs/ANALYTICS_GOVERNANCE.md` §1 withdrawal row (`AN-P3-008`).
- `docs/ANALYTICS_GOVERNANCE.md` §3 retention source if `AN-P3-007` is fixed.
- `docs/modules/analytics.md`: metadata value policy.

## Open Questions

| Question | Why it matters | Evidence needed |
|---|---|---|
| Is any free-text metadata legitimately needed? | Determines allowlist vs scanner | Product/analytics requirements |
| Should analytics retention be tenant-configurable? | Drives AN-P3-007 priority | Data-governance decision |
| Has GA/Tawk/Sentry retention been set to match the policy? | Vendor-side compliance | Vendor console screenshots |

## Appendix

Track endpoint control flow at `6b7aa1a5`:

```
POST /api/v1/analytics/track
  -> z.enum(ANALYTICS_EVENT_NAMES)
  -> sanitizeAnalyticsMetadata (25 keys, 200 chars, PII-named keys dropped)
  -> store_analytics_events insert (service role)
```

No GA, Tawk.to, Sentry or database traffic was generated.
