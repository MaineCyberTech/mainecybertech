# SBOM Process

Owner: Platform Engineering. Last updated 2026-10-02.

How the portal's software bill of materials is produced, what it covers, and how
to retrieve and verify it. There are **two** distinct CycloneDX artifacts — a
lockfile SBOM and per-image SBOMs — with different scope and binding.

## What we generate

| Artifact | Producer | Covers | Bound to |
| --- | --- | --- | --- |
| **Lockfile SBOM** (`sbom.cdx.json`) | `.github/workflows/sbom.yml` → `scripts/generate-sbom.mjs` | npm dependencies resolved from `pnpm-lock.yaml` | `<VERSION>+<commit SHA>` (`metadata.component.version`, `mct:commit`) |
| **Image SBOM** (`image-sbom-mct-<image>.cdx.json`) | `.github/workflows/build-push.yml` (per image) → `aquasecurity/trivy-action` | The built OCI image: Alpine OS packages **and** npm-in-image contents | The pushed image **digest** (`metadata.component.purl`/`name` = `...@sha256:...`) |

### Lockfile SBOM

`sbom.yml` runs `scripts/generate-sbom.mjs` on push/PR to `main`/`develop`,
weekly, and on manual dispatch. The output is a **CycloneDX 1.5** JSON document
(`sbom.cdx.json`) uploaded as the `sbom-cyclonedx` artifact (30-day retention).

The document includes:

- `components[]` — one per resolved lockfile package (`purl`, integrity hash
  converted to **hex**, and `licenses`).
- `licenses` per component, sourced from `pnpm licenses list --json`
  (`license.id` for SPDX ids, `license.expression` for SPDX expressions such as
  `Apache-2.0 AND LGPL-3.0-or-later`, and `license.name` for ids newer than the
  CycloneDX 1.5 SPDX enum, e.g. `FSL-1.1-MIT`).
- `dependencies[]` — the dependency graph (root → workspace importers, and
  package → package edges from the lockfile `snapshots:` section).
- `serialNumber` — deterministic UUID derived from the content + commit.
- `metadata.component.version` — `<product version>+<commit SHA>` (REL-P1-001),
  with `mct:productVersion` and `mct:commit` properties.

### Image SBOM

`build-push.yml` generates one image SBOM per image (`mct-api`, `mct-worker`,
`mct-web`) using Trivy's CycloneDX output. The equivalent command line is:

```bash
trivy image --format cyclonedx --scanners vuln --output image-sbom-mct-api.cdx.json \
  ghcr.io/<owner>/mct-api@sha256:<digest>
```

The workflow runs this through `aquasecurity/trivy-action` (`scan-type: image`,
`format: cyclonedx`), reusing the same registry auth and Trivy database cache as
the CRITICAL/HIGH image scan in the same job. The scan target is the **pushed
digest** (`${{ steps.build-<image>.outputs.digest }}`), not the mutable tag, so
Trivy records the digest in `metadata.component.purl`/`name` and in the
`aquasecurity:trivy:RepoDigest` property — the SBOM is self-bound to the exact
image identity that was pushed.

Each SBOM is uploaded as the workflow artifact
`image-sbom-mct-<image>-<commit>` (30-day retention). This complements the
lockfile SBOM: the lockfile SBOM explains the JavaScript dependency tree, while
the image SBOM explains the OS packages and anything else physically present in
the built layer.

## Product version source of truth

[`VERSION`](../VERSION) at the repository root holds the product version (for
example `0.1.0`). `generate-sbom.mjs` reads it and records
`<version>+<GITHUB_SHA>` so a generated artifact is bound to the exact commit it
was built from. No git tags are required — the commit SHA is authoritative.

A release is the GHCR images (`mct-api`, `mct-worker`, `mct-web`) tagged with the
deploying commit SHA (see [docs/RELEASING.md](RELEASING.md)). To bind an image
SBOM to a release: the artifact name carries the commit, and the SBOM's
`metadata.component.purl` carries the image digest; confirm that digest is the
one associated with the `mct-<image>:<commit>` tag in the registry.

## Scope and known exclusions

The **lockfile SBOM** covers **npm dependencies from `pnpm-lock.yaml`**. It does
**not** cover:

- Docker base-image OS packages (`node:20-alpine@sha256:...`) — covered by the
  **image SBOM** instead.
- The GitHub Actions runner environment.
- Workspace packages themselves are represented as `application` components for
  the importers, not as libraries.

The **image SBOM** covers the built image contents (OS packages + language
packages present in the image). It does **not** cover the build environment, the
registry, or the deploy host.

## Validation

`scripts/validate-sbom.mjs` runs in `sbom.yml` before upload and fails the job
on a malformed **lockfile** SBOM: missing/invalid `bomFormat`/`specVersion`,
duplicate `bom-ref`s, dangling `dependencies` edges, a component count below the
sanity floor (parser-regression guard), or a missing version/commit binding. It
targets the CycloneDX 1.5 lockfile document and is not run against the Trivy
image SBOMs (which use Trivy's own schema and binding fields).

## Who consumes these

- **Incident response / security** — match an advisory (OS package or npm
  package) to the digest actually running in production via the image SBOM.
- **License / dependency review** — use the lockfile SBOM's `licenses` and
  `dependencies` graph plus `scripts/license-gate.mjs`.
- **Audit / compliance** — record the per-commit artifacts as evidence of what
  shipped.

## Retrieve and verify

```bash
# Local lockfile SBOM generation
pnpm install --frozen-lockfile
pnpm licenses list --json > licenses.json
node scripts/generate-sbom.mjs sbom.cdx.json
node scripts/validate-sbom.mjs sbom.cdx.json

# Cryptographically verify a released image's BUILD PROVENANCE (not the SBOM)
gh attestation verify oci://ghcr.io/<owner>/mct-api:<sha> --repo <owner>/<repo>

# Lockfile SBOM artifact (30 days)
gh run download <run-id> -n sbom-cyclonedx

# Image SBOM artifacts (30 days; run-id from a build-push run)
gh run download <run-id> -n image-sbom-mct-api-<commit>
gh run download <run-id> -n image-sbom-mct-worker-<commit>
gh run download <run-id> -n image-sbom-mct-web-<commit>

# Confirm an image SBOM is bound to a digest
jq '.metadata.component.purl' image-sbom-mct-api.cdx.json
```

## Known gaps

- **Image SBOMs are only produced by `build-push.yml`**, which is
  manual-dispatch only. The push-triggered build/deploy path (`deploy-do.yml`)
  does not emit them yet; parity there is tracked separately by its owner.
- The image SBOM is an **artifact only**. It is not attested
  (`actions/attest-sbom`), not signed, not attached to the registry as an OCI
  referrer, and not uploaded to a GitHub Release. Build provenance
  (`actions/attest-build-provenance`, bound to the same digest and pushed to the
  registry with `push-to-registry: true`) is the only image-level trust
  artifact; it proves where the image was built, not what is inside it.
- The lockfile SBOM is uploaded as a CI artifact rather than attached to a
  GitHub Release. Release attachment remains open (SBOM-P2-001) because there is
  no tag or Release step yet; the commit binding added here is the prerequisite.
- All SBOM artifacts expire after 30 days; there is no durable release-bound
  copy yet.
