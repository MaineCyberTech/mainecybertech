# Patch plan

## CI-P2-001 - World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port

Add an environment approval (prod-approval or a dedicated firewall-approval), restrict droplet to an explicit choice allow-list, validate udp_port (^[0-9]{1,5}$, documented allow-list), build the JSON with jq -n --argjson instead of interpolation, narrow sources to known lab/VPN CIDRs, and add an expiry/removal + audit step. Consider a separate least-privilege token/workflow for firewall changes.

## CI-P2-002 - Deploy-gate secret scan is a no-op on pushes to main

For push events, diff against github.event.before (fall back to HEAD~1 when it is all-zeros), not git merge-base with origin/main. Add a regression test that a synthetic secret on the push path fails the scan.

## CI-P2-003 - Production approval environment documented as having no required reviewers

Configure prod-approval with 1+ required reviewers in GitHub Settings -> Environments, move prod migrations under prod-approval, and update the matrix/runbooks. Add a runbook verification step and, if possible, a check that the environment has protection rules.

## PORT-P2-001 - 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail

git update-index --chmod=+x the 17 scripts and commit; add a CI check that no tracked *.sh is mode 100644.

## SEC-P2-001 - Secret scanner echoes the matched secret value into CI logs

Print only file, line number and rule name; never echo the diff or matched value; call ::add-mask:: before any echo. Apply the same change to scripts/scan-secrets.sh. Add a test asserting no matched value appears in output.

## SEC-P2-002 - Webhook SSRF guard has a DNS-rebinding TOCTOU window

Resolve once and connect to the validated IP while preserving the Host header (custom undici lookup / ssrf-req-filter), or re-validate the connected peer IP and abort on change; explicitly block link-local/metadata ranges. Apply the same pattern in webhook-management.ts.

## CONF-P2-001 - Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy

Add SCHEDULE_DISPATCH_TOKEN to the secrets matrix and SECRETS_ROTATION.md with an owner and 90-day rotation; prefer a repository-scoped GitHub App installation token with short expiry over a classic PAT.

## CI-P3-001 - actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015)

Quote GITHUB_ENV/GITHUB_OUTPUT/GITHUB_STEP_SUMMARY and expression-derived variables; add an actionlint CI job (and optionally zizmor for security-specific checks).

## CI-P3-002 - Over-broad workflow token permissions (unused write scopes)

Remove unused actions: write / pull-requests: write; scope any genuinely needed write permission to the specific job (deploy-do.yml already job-scopes verify-attestations). Re-run actionlint/zizmor to confirm.

## CI-P3-003 - StrictHostKeyChecking=no in the deploy health check

Pin the droplet host key via a secret and use StrictHostKeyChecking=yes with a known_hosts file (or the host-key configuration used by the appleboy/ssh-action steps).

## SEC-P3-001 - gitleaks generic-api-key/jwt hits are false positives (no tracked secret)

Commit a .gitleaks.toml allowlisting prompts/manifest.json (hashes), the m365-hardening key and test fixtures; optionally run gitleaks in CI with high-confidence rules only. Do not allowlist broad path globs that could hide real secrets.

## SUPPLY-P3-001 - Unpinned container images (test/local only); production app images tag-based by design

Pin the playwright and postgres test images by digest and consider pinning the Supabase local image set; document that app images are intentionally tag-addressed and attestation-verified.

## SUPPLY-P3-002 - Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK

Add WORKDIR /app to the web runner stage before the COPYs; optionally use exec-form HEALTHCHECK arrays. Add hadolint to CI with documented ignores if needed.

## CONF-P3-001 - Secret rotation policy has no evidence any secret was ever rotated

Populate the Rotation Log on the next cycle with date, operator, environment and the gh secret set / deploy run URL; have the secret-rotation-reminder issue require a reviewer to confirm the log entry.

