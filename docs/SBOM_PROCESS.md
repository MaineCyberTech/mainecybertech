# SBOM Process

Owner: Platform Engineering. Last updated 2026-10-02.

How the portal's software bill of materials is produced, what it covers, and how
to retrieve and verify it.

## What we generate

`.github/workflows/sbom.yml` runs `scripts/generate-sbom.mjs` on push/PR to
`main`/`develop`, weekly, and on manual dispatch. The output is a
**CycloneDX 1.5** JSON document (`sbom.cdx.json`) uploaded as the
`sbom-cyclonedx` artifact (30-day retention).

The document now includes:

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

## Product version source of truth

[`VERSION`](../VERSION) at the repository root holds the product version (for
example `0.1.0`). `generate-sbom.mjs` reads it and records
`<version>+<GITHUB_SHA>` so a generated artifact is bound to the exact commit it
was built from. No git tags are required — the commit SHA is authoritative.

## Scope and known exclusions

The SBOM covers **npm dependencies from `pnpm-lock.yaml`**. It does **not**
cover:

- Docker base-image OS packages (`node:20-alpine@sha256:…`) — these are covered
  by the image scan and the image provenance attestation instead.
- The GitHub Actions runner environment.
- Workspace packages themselves are represented as `application` components for
  the importers, not as libraries.

Image builds in `deploy-do.yml` / `build-push.yml` additionally attach a build
provenance attestation (`actions/attest-build-provenance`) bound to the pushed
image digest; that is the image-level trust artifact, complementing this
lockfile SBOM.

## Validation

`scripts/validate-sbom.mjs` runs in `sbom.yml` before upload and fails the job
on a malformed SBOM: missing/invalid `bomFormat`/`specVersion`, duplicate
`bom-ref`s, dangling `dependencies` edges, a component count below the sanity
floor (parser-regression guard), or a missing version/commit binding.

## Retrieve and verify

```bash
# Local generation
pnpm install --frozen-lockfile
pnpm licenses list --json > licenses.json
node scripts/generate-sbom.mjs sbom.cdx.json
node scripts/validate-sbom.mjs sbom.cdx.json

# CI artifact (30 days)
gh run download <run-id> -n sbom-cyclonedx

# Verify a released image's build provenance
gh attestation verify oci://ghcr.io/<owner>/mct-api:<sha> --repo <owner>/<repo>
```

## Known gaps

- The SBOM is still uploaded as a CI artifact rather than attached to a GitHub
  Release. Release attachment remains open (SBOM-P2-001) because there is no tag
  or Release step yet; the commit binding added here is the prerequisite.
