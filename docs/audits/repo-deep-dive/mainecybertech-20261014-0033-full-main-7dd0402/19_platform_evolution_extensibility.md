# 19_platform_evolution_extensibility — Prompt 19 - Platform Evolution and Extensibility Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `19_platform_evolution_extensibility.md` (area EVOL, prompt)

## Verification Performed

Domain subagent produced 11 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

## Findings

| ID | Severity | Title |
|---|---|---|
| EVOL-P2-001 | P2 | No module registry: module metadata is duplicated across six disconnected catalogs with no drift guard |
| EVOL-P2-002 | P2 | Webhook UI advertises 11 event types but only 2 are ever dispatched; no event catalog exists |
| EVOL-P3-001 | P3 | Feature flags are a hardcoded static map with no managed service, change log, or targeting |
| EVOL-P3-002 | P3 | No catalog-lint: referenced permission keys are not checked against the permissions table |
| EVOL-P3-003 | P3 | No committed event catalog or webhook documentation for consumers |
| EVOL-P3-004 | P3 | API versioning policy is documented but not enforced (no Sunset/Deprecation mechanism; spec version unrelated to the app version) |
| EVOL-P3-005 | P3 | Config model is duplicated per app; there is no shared env-schema package |
| EVOL-P3-006 | P3 | Shared-package extraction is deferred: @mct/sdk and @mct/ui are source-only, and DB client setup is duplicated |
| EVOL-P3-007 | P3 | Migration-strategy docs contradict each other and the tree (ISO vs sequential naming; seed.sql references) |
| EVOL-P3-008 | P3 | Roles, plan-to-module mapping, and status vocabularies are hardcoded with no parity guard |
| EVOL-P3-009 | P3 | Two overlapping outbound-webhook consumer docs (docs/EVENTS.md, docs/WEBHOOKS.md); only one is guarded and they already diverge |
