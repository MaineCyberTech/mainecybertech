# Dependency Policy

Policy owner: Platform Engineering. Last updated 2026-10-02.

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
with a reason and an expiry. They never block but are always printed.

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
- `onlyBuiltDependencies` (root `package.json`) restricts postinstall scripts to
  an allowlist (`@sentry/cli`). Adding an entry requires review.

## Local commands

```bash
node scripts/audit-gate.mjs          # full policy gate (all scopes)
node scripts/audit-gate.mjs --report # report only, never fail
node scripts/license-gate.mjs        # license policy (needs licenses.json; see below)
pnpm licenses list --json > licenses.json
```
