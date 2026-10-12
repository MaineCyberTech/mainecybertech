# Dependency Policy

Policy owner: Platform Engineering. Last updated 2026-10-12.

How dependency vulnerabilities, overrides, and updates are governed. The
machine-enforced policy is
[`security/dependency-audit-policy.json`](../security/dependency-audit-policy.json),
applied by `scripts/audit-gate.mjs`.

## Vulnerability gate

`scripts/audit-gate.mjs` runs in `test.yml` and `validate.yml` (the deploy
gate). It audits **all** dependency scopes and applies this policy:

| Scope | Severity | Behaviour |
| --- | --- | --- |
| any | `critical` | **block** |
| production | `high` or `critical` | **block** |
| development | `high` | reported, non-blocking |
| development | `moderate` and below | reported, non-blocking |

Dev-tree advisories are printed on every run so they stay visible even when
they do not block. (This closes SC-P1-001: the previous gate ran
`pnpm audit --audit-level=high --prod`, so a critical/high reachable only through
the dev toolchain was invisible to CI.)

### Allowlist

Known, genuinely unpatchable findings can be recorded in the policy `allowlist`
with a reason and an expiry. They never block while the entry is in date, but
they are always printed. The expiry is enforced: a missing or malformed date, or
a date before today, means the entry stops suppressing the finding and is itself
reported as a policy violation (`LAPSED-ALLOWLIST`), so an accepted risk cannot
silently outlive its review (SBOM-P2-010). Renewing means re-reviewing the
advisory and moving the date forward in the same PR.

| Advisory | Package | Scope | Reason |
| --- | --- | --- | --- |
| `GHSA-848j-6mx2-7j84` | `elliptic` (low) | dev | No patched version exists (`<0.0.0`). Reached only through `@storybook/nextjs > node-polyfill-webpack-plugin > crypto-browserify > browserify-sign > elliptic`; never in production images. Remove once upstream fixes it or Storybook drops the polyfill chain. |

## `pnpm.overrides`

Overrides force patched transitive versions. They are declared in the root
`package.json` `pnpm.overrides` and mirrored in `pnpm-lock.yaml`.

Governance:

- Every override must be synced to the lockfile (`pnpm install --lockfile-only`
  updates it; CI's `--frozen-lockfile` catches divergence).
- An override that only widens a *declared peer range* is fine, but avoid one
  that can never match the resolution it was added for.
- The `next` override is deliberately `">=15.5.24 <16 || >=16.3.6"`: the 15.x
  line stays on the app's supported major, while any 16.x that the Storybook
  toolchain might pull is forced to the patched `>=16.3.6` line. Both halves
  matter — the earlier `">=15.5.24 <16"` could never match a 16.x resolution.

| Override | Scope | Target advisory / rationale |
| --- | --- | --- |
| `next` | global | `GHSA-vcvr-r3jv-pc5j` (`next/og` RCE) — keep every line `>=` its patched release |
| `webpack-dev-middleware` | global | path traversal `<7.4.5` |
| `brace-expansion` (scoped + global) | global/scoped | DoS `<1.1.20` |
| `js-yaml` | global | prototype pollution; `>=5` line separately |
| `sharp` | global | `GHSA` / libvips; also pins the platform binaries |
| others | global | see `package.json` |

## Update governance

- `.github/dependabot.yml` covers npm, github-actions, docker, and terraform,
  grouped, weekly on Monday.
- Security updates should be triaged promptly; the audit noted a large backlog.
  When a Dependabot PR changes the resolved tree, the audit and license gates
  re-run automatically.
- Advisories published between PRs/deploys are surfaced by the weekly
  `dependency-rescan.yml` workflow (Mondays 06:00 UTC): it re-runs
  `scripts/audit-gate.mjs --report` over the resolved tree plus a Trivy
  filesystem scan, and uploads the reports as the `dependency-rescan` artifact.
  It is report-only by design (SBOM-P2-012) — triage the artifact and open a
  fix/Dependabot PR when a finding would block under the real gate.
- `onlyBuiltDependencies` (root `package.json`) restricts postinstall scripts to
  an allowlist (`@sentry/cli`). Adding an entry requires review.

### Backlog triage (SBOM-P2-007 / SC-P2-005)

The queue is kept visible by `dependabot-triage-reminder.yml` (weekly, Mondays
07:00 UTC): it opens one deduplicated `Weekly Dependabot triage` issue listing
the open PRs and this policy. Close the issue once the queue is triaged.

SLA: security updates within 7 days; patch/minor updates within 30 days; a
major-version update gets a dedicated upgrade issue (and an explicit
supported-version decision) instead of a blind merge.

Merge rules:

- Merge a Dependabot PR only after it is rebased onto current `develop` and
  every required check is green. Never force-push a Dependabot branch, and
  never merge a red PR to "unblock" it.
- An update that cannot satisfy a `pnpm.overrides` floor is not mergeable. The
  closed `next` 16.2.9 PR (#14) is the worked example: 16.2.9 sits below the
  `>=16.3.6` half of the `next` override, so the resolved-tree audit rejects
  it; it was superseded by the 16.3.8+ PR (#102).
- Major runtime bumps (e.g. the open `node:25-alpine` image PRs) are held until
  the Node support line is upgraded deliberately; they are not auto-merged.

## Local commands

```bash
node scripts/audit-gate.mjs          # full policy gate (all scopes)
node scripts/audit-gate.mjs --report # report only, never fail
node scripts/license-gate.mjs        # license policy (needs licenses.json; see below)
pnpm licenses list --json > licenses.json
```
