# SBOM & License Policy Recommendation

> Companion artifact to audit prompt 40. Derived from sibling report
> `35_sbom_license_policy.md` (area code **SBOM**) in run
> `20261002-0344-develop-6286137`, repository `mainecybertech/mainecybertech`
> at commit `62861370`. Read-only: no code, workflows, or lockfiles were changed.

## Why this matters for releases

A release's SBOM is part of the shipped artifact set. Prompt 40's extended check
requires that generated artifacts record the commit/version they were built from
and match the artifact set they ship with. The current SBOM satisfies **neither**
condition, which is why the release-notes draft cannot cite a verifiable
supply-chain artifact (finding REL-P1-001).

## Current state (evidence)

| Item | Evidence | Finding |
|---|---|---|
| SBOM generator | `scripts/generate-sbom.mjs` — emits 1481 components, all hashed, matching `pnpm-lock.yaml` exactly | Strength (reproduced) |
| SBOM workflow | `.github/workflows/sbom.yml:1-34` — generate + upload `sbom-cyclonedx`, 30-day retention | Artifact-only, no gate, no release binding |
| SBOM binding | no `serialNumber`, no commit SHA, `metadata.component.version` absent | SBOM-P2-001 |
| SBOM contents | no `licenses`, no `dependencies` graph | SBOM-P1-002 |
| License policy | `dependency-review.yml:15-17` has only `fail-on-severity: high`; no `allow-licenses`/`deny-licenses`; no `docs/LICENSE_POLICY.md` | SBOM-P1-001 |
| Present restrictive licenses | `pnpm licenses list`: `@img/sharp-win32-x64` = `Apache-2.0 AND LGPL-3.0-or-later`; `axe-core`, `@axe-core/playwright` = `MPL-2.0`; 2 × `FSL-1.1-MIT` | Ungated |
| Container SBOM | none; `build-push.yml`/`deploy-do.yml` have no `sbom:`/`provenance:` flags | SBOM-P2-002 |
| Doc claim | `docs/CI.md:25` calls the SBOM workflow "Blocking" (it gates nothing) | SBOM-P2-003 |
| Manifest license | root + all workspaces `"license": "ISC"`; real `LICENSE` present | SBOM-P3-001 |

## Recommended changes

### P1 — release-blocking

1. **Add a license allow/deny policy** to `.github/workflows/dependency-review.yml`:
   ```yaml
   - uses: actions/dependency-review-action@2031cfc080254a8a887f58cffee85186f0e49e48
     with:
       fail-on-severity: high
       allow-licenses: MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, 0BSD,
         Unlicense, CC0-1.0, BlueOak-1.0.0, MIT-0, Artistic-2.0, Python-2.0,
         CC-BY-4.0, WTFPL
       deny-licenses: GPL-1.0-or-later, GPL-2.0-or-later, GPL-3.0-or-later,
         AGPL-1.0-or-later, AGPL-3.0-or-later, SSPL-1.0, BUSL-1.1
   ```
2. **Create `docs/LICENSE_POLICY.md`** — approved/denied licenses, exception
   process, and the disposition of the already-present `MPL-2.0`
   (`axe-core`), `LGPL-3.0-or-later` (`@img/sharp-win32-x64`), and `FSL-1.1-MIT`
   components.
3. **Bind the SBOM to the commit**: embed the 40-hex SHA and a `serialNumber` in
   `scripts/generate-sbom.mjs`; add per-component `licenses` and a top-level
   `dependencies` graph.

### P2 — this week/month

4. **Publish the SBOM as a release asset / OCI attestation** and add
   `actions/attest-build-provenance` to the image builds (OIDC `id-token: write`
   already exists in `deploy-do.yml:29`). Verify with
   `gh attestation verify sbom.cdx.json --repo <owner>/<repo>`.
5. **Add container/image SBOM** generation (`anchore/sbom-action` or
   `docker buildx build --sbom=true`) for `mct-api`, `mct-worker`, `mct-web`.
6. **Fix `docs/CI.md:25`** — change the SBOM gate description from "Blocking" to
   "Artifact-only (not a gate)", or make it a real required check.

### P3 — polish

7. Add CycloneDX schema validation + a component-count regression guard to
   `sbom.yml`.
8. Document the ISC choice in `docs/LICENSE_POLICY.md`.

## Verification

- PR adding a `GPL-3.0` dependency must fail `dependency-review`.
- Generated SBOM contains a 40-hex SHA; `components.length` equals the lockfile
  `packages:` count (1481 at this commit).
- `gh attestation verify` succeeds for a released image/SBOM.
- `docs/CI.md` matches the workflow definition.

## Risk if unchanged

A copyleft/restrictive dependency could merge undetected; the SBOM cannot answer
"which license?" or "who pulls in vulnerable X?"; and the shipped image has no
verifiable SBOM/provenance. Track as **SBOM-P1-001/002** and **SBOM-P2-001/002**.

*Source report: `35_sbom_license_policy.md`.*
