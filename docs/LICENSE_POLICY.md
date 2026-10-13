# License Policy

Policy owner: Platform Engineering. Legal review: Founder. Last updated
2026-10-03.

This document is the human-readable companion to
[`security/license-policy.json`](../security/license-policy.json), which is the
machine-enforced source of truth. The policy is applied in two places:

1. **PR gate** — `.github/workflows/dependency-review.yml` applies the
   allow-list (plus the reviewed exception packages) to the diff of a pull
   request, so a newly introduced dependency with any other license fails.
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
explicitly accepted. Each entry is matched on **(license, package)**: it covers
only the packages named in its `packages` list — a *different* package with the
same license still fails the gate. `UNKNOWN` is not a blanket allowance either:
a package whose license cannot be determined fails unless that exact package is
listed.

Every entry must also carry an `expires` date. `scripts/license-gate.mjs` treats
a missing, malformed, or past date as expired: the entry stops accepting, and
each package relying on it is reported as `EXPIRED-EXCEPTION` and fails the
gate. Renewing means re-reviewing the exception and moving the date (and this
table) forward in the same PR.

| License | Packages | Why accepted | Review by |
| --- | --- | --- | --- |
| `MPL-2.0` | `axe-core`, `@axe-core/playwright` | Test-only accessibility checker reached through Playwright/a11y tooling. Weak file-level copyleft; we do not modify or redistribute its files, and it is not in production images. | 2027-10-02 |
| `LGPL-3.0-or-later` | `@img/sharp-libvips-linux-x64` | libvips prebuilt binary pulled in on Linux by sharp, reached only through `@storybook/nextjs` (dev/build-time); no app declares sharp as a runtime dependency and production images build with `--prod`. LGPL attaches to the unmodified binary. | 2027-10-03 |
| `FSL-1.1-MIT` | `@sentry/cli`, `@sentry/cli-win32-x64`, `@sentry/cli-linux-x64` | Build/CI/observability CLI tooling, not linked into or redistributed with the product. FSL is source-available (not OSI) and converts to MIT after its change date. | 2027-10-02 |
| `UNKNOWN` | `browser-assert` | Dev-only Storybook transitive dependency whose published `package.json` declares no license field; never present in production images or shipped artifacts. | 2027-10-02 |

`MPL-2.0` is not on the deny list, so the PR gate does not flag it; it is listed
here because the full-tree gate treats *only* the allowed list and exceptions as
passing.

## Adding, changing, or removing a dependency

- If the dependency uses an allowed license, nothing to do.
- If it uses a denied, unknown, or unlicensed value, the PR fails. Either
  replace the dependency or, after a maintainer/legal decision, add an entry to
  `security/license-policy.json` `exceptions` **and** a row to the table above.
  The entry must name the exact package(s) and carry a future `expires` date.
- When the gate reports `EXPIRED-EXCEPTION`, re-review the dependency and either
  renew the entry (new date here and in the JSON) or remove it.
- The full-tree gate prints a warning when an exception is configured but no
  longer present, so stale exceptions get removed.

## Product license

The monorepo itself is `ISC` (see [`LICENSE`](../LICENSE) and every
`package.json`). ISC is permissive and MIT-equivalent; it is intentional for
this private, non-published monorepo. (Finding SBOM-P3-001 is a documentation
gap, not a license change request.)

**Owner acceptance (2026-10-12, SBOM-P3-003):** the maintainer reviewed the
license choice and accepts `ISC` for the root and every workspace package; the
root `package.json` `license` field, the `LICENSE` text and this policy now
agree. This line is the sign-off artifact — re-open the choice if any package
is ever published to a registry.

## Generated artifacts (tracking policy)

Generated supply-chain/legal aggregates are **ignored and regenerated**, never
committed. This is a single policy for every such artifact so a stale committed
copy cannot drift from the lockfile:

| Artifact | Producer | Consumer | Tracking |
| --- | --- | --- | --- |
| `licenses.json` | `node scripts/collect-licenses.mjs --out licenses.json` | `scripts/license-gate.mjs`, `scripts/generate-sbom.mjs` | `.gitignore`d; regenerated in CI |
| `sbom.cdx.json`, `sbom.spdx.json` | `node scripts/generate-sbom.mjs` (`.github/workflows/sbom.yml`) | uploaded as an artifact, bound to the commit SHA | `.gitignore`d; regenerated in CI |

CI enforces the policy from both directions:

- `test.yml` → **License policy gate** fails on a denied/unknown license over the
  freshly regenerated inventory.
- `test.yml` → **Ensure generated license/SBOM artifacts stay untracked** fails
  if any of the files above is committed again.

To inspect the current inventory locally, regenerate it (do not commit it):

```bash
node scripts/collect-licenses.mjs --out licenses.json
```

The SBOM is generated on demand by `sbom.yml` and, where a release needs it,
attached to that release; see `docs/SBOM_PROCESS.md`.
