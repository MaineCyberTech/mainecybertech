# License Policy

Policy owner: Platform Engineering. Legal review: Founder. Last updated
2026-10-02.

This document is the human-readable companion to
[`security/license-policy.json`](../security/license-policy.json), which is the
machine-enforced source of truth. The policy is applied in two places:

1. **PR gate** — `.github/workflows/dependency-review.yml` denies strong
   copyleft / source-available licenses on the diff of a pull request.
2. **Full-tree gate** — `scripts/license-gate.mjs` runs in
   `.github/workflows/test.yml` and `.github/workflows/validate.yml` (the deploy
   gate) over the entire resolved tree, using the allowlist and exceptions
   below.

## Allowed licenses

These permissive licenses are approved for all dependency scopes:

```
MIT, MIT-0, ISC, Apache-2.0, Apache-1.1, BSD-2-Clause, BSD-3-Clause,
BSD-3-Clause-Clear, BSD-4-Clause, 0BSD, BlueOak-1.0.0, Unlicense, CC0-1.0,
CC-BY-4.0, CC-BY-3.0, Python-2.0, Artistic-2.0, WTFPL, Zlib, BSL-1.0,
PostgreSQL, OpenSSL, X11, NCSA, MS-PL, UPL-1.0
```

A pure SPDX expression (for example `(MIT OR CC0-1.0)` or `MIT AND Zlib`)
passes when every leaf is allowed.

## Denied licenses

Strong copyleft and source-available licenses are denied. Introducing one fails
CI unless it is explicitly reviewed and added to the exceptions below:

```
GPL-1.0/2.0/3.0 (all forms), AGPL-1.0/3.0 (all forms), SSPL-1.0, BUSL-1.1,
CC-BY-NC-4.0, CC-BY-NC-SA-4.0, EUPL-1.1, EUPL-1.2, OSL-3.0, RPL-1.5
```

## Documented exceptions

These restricted licenses are already present in the resolved tree and are
explicitly accepted. Each is scoped to the named packages only — a *different*
package with the same license still fails the gate.

| License | Packages | Why accepted | Review by |
| --- | --- | --- | --- |
| `MPL-2.0` | `axe-core`, `@axe-core/playwright` | Test-only accessibility checker reached through Playwright/a11y tooling. Weak file-level copyleft; we do not modify or redistribute its files, and it is not in production images. | 2027-10-02 |
| `Apache-2.0 AND LGPL-3.0-or-later` | `@img/sharp-win32-x64` | Sharp's Windows-only prebuilt native binary (optional platform dependency). Not loaded on Linux production images; LGPL attaches to the unmodified binary. | 2027-10-02 |
| `FSL-1.1-MIT` | `@sentry/cli`, `@sentry/cli-win32-x64` | Build/CI/observability CLI tooling, not linked into or redistributed with the product. FSL is source-available (not OSI) and converts to MIT after its change date. | 2027-10-02 |

`MPL-2.0` is not on the deny list, so the PR gate does not flag it; it is listed
here because the full-tree gate treats *only* the allowed list and exceptions as
passing.

## Adding, changing, or removing a dependency

- If the dependency uses an allowed license, nothing to do.
- If it uses a denied or unknown license, the PR fails. Either replace the
  dependency or, after a maintainer/legal decision, add an entry to
  `security/license-policy.json` `exceptions` **and** a row to the table above.
- The full-tree gate prints a warning when an exception is configured but no
  longer present, so stale exceptions get removed.

## Product license

The monorepo itself is `ISC` (see [`LICENSE`](../LICENSE) and every
`package.json`). ISC is permissive and MIT-equivalent; it is intentional for
this private, non-published monorepo. (Finding SBOM-P3-001 is a documentation
gap, not a license change request.)
