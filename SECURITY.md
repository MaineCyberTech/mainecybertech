# SECURITY.md

## Reporting a security issue

If you discover a security issue in the Maine CyberTech Portal, do **not** open a public issue containing exploit details, credentials, or private tenant data.

Instead, email **security@mainecybertech.com** (or the repository owner / maintainer if that address is unavailable) with:

- a clear description of the issue
- reproduction steps if safe to share
- potential impact and affected components

Please give us a reasonable window to investigate and remediate before any public disclosure — we aim to acknowledge within 3 business days and to agree a disclosure timeline with you. Do not test against production data or other tenants; use the local stack (`supabase start` + seeds).

## Supported versions

Only the `main` branch (production) and `develop` (staging) are supported. Older tags receive no security fixes.

## Related runbooks

- [docs/SECRETS_ROTATION.md](docs/SECRETS_ROTATION.md)
- [docs/JWT_ROTATION.md](docs/JWT_ROTATION.md)
- [docs/RLS-rollout.md](docs/RLS-rollout.md)
- [docs/MFA.md](docs/MFA.md)
- [docs/DEPENDENCY_POLICY.md](docs/DEPENDENCY_POLICY.md)
- [docs/LICENSE_POLICY.md](docs/LICENSE_POLICY.md)
- [docs/SBOM_PROCESS.md](docs/SBOM_PROCESS.md)

## Supply chain

- **Vulnerabilities** — `scripts/audit-gate.mjs` gates all dependency scopes in
  CI (block CRITICAL any scope, block HIGH+ in production, report dev-tree
  advisories). Policy: `security/dependency-audit-policy.json`.
- **Licenses** — `scripts/license-gate.mjs` and the dependency-review PR gate
  enforce `security/license-policy.json` (allowlist + documented exceptions).
- **Container images** — every image is scanned with Trivy
  (`scan-type: image`, CRITICAL/HIGH) after build and before deploy, and gets a
  build-provenance attestation bound to its digest. The deploy pipeline
  **verifies** that attestation before pulling: the `verify-attestations` job
  resolves the tag to a digest and runs `gh attestation verify`, and `deploy`
  `needs:` it (normal deploys fail closed; see
  [docs/CI.md](docs/CI.md#provenance-verification-at-deploy-ctr-p1-003)). Verify
  manually with `gh attestation verify oci://ghcr.io/<owner>/mct-api@<digest>
  --repo <owner>/<repo>`.
- **SBOM** — two CycloneDX artifacts are produced: a **lockfile** SBOM
  (licenses, dependency graph, commit binding) generated and validated in CI,
  and a per-image **image** SBOM (Alpine OS + npm-in-image contents) bound to
  the pushed image digest by `build-push.yml`. Neither SBOM is signed or
  attested; see [docs/SBOM_PROCESS.md](docs/SBOM_PROCESS.md).

## Sensitive areas in this repository

Particular care should be taken when reviewing or changing:

- authentication flows (PKCE callback, `mct_session`, MFA/`aal2` enforcement)
- environment variables and secrets
- Supabase roles and keys
- row-level security (RLS) policies
- storage policies
- billing or contract-related data paths
- audit log or admin access behavior (platform-admin impersonation is logged)

## Safe handling expectations

- Never commit real `.env` or secret values.
- Never publish tenant or customer data in issues, PRs, or screenshots.
- Avoid posting raw production logs if they contain sensitive values.
- Treat migration and policy changes as security-sensitive changes.
- Prefer `redirect: "manual"` + the SSRF guard for any user-supplied URL; never disable the CSRF double-submit cookie's `httpOnly: false` (the SDK reads it).
