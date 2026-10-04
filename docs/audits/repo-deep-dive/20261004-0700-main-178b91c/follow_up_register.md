# Follow-up register

| Finding | Severity | Title | Owner | Target | Status | Note |
|---|---|---|---|---|---|---|
| CI-P2-001 | P2 | World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port | @owner | CI | open | Add an environment approval (prod-approval or a dedicated firewall-approval), restrict droplet to an explicit choice all |
| CI-P2-002 | P2 | Deploy-gate secret scan is a no-op on pushes to main | @owner | CI | open | For push events, diff against github.event.before (fall back to HEAD~1 when it is all-zeros), not git merge-base with or |
| CI-P2-003 | P2 | Production approval environment documented as having no required reviewers | @owner | CI | open | Configure prod-approval with 1+ required reviewers in GitHub Settings -> Environments, move prod migrations under prod-a |
| PORT-P2-001 | P2 | 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail | @owner | PORT | open | git update-index --chmod=+x the 17 scripts and commit; add a CI check that no tracked *.sh is mode 100644. |
| SEC-P2-001 | P2 | Secret scanner echoes the matched secret value into CI logs | @owner | SEC | open | Print only file, line number and rule name; never echo the diff or matched value; call ::add-mask:: before any echo. App |
| SEC-P2-002 | P2 | Webhook SSRF guard has a DNS-rebinding TOCTOU window | @owner | SEC | open | Resolve once and connect to the validated IP while preserving the Host header (custom undici lookup / ssrf-req-filter),  |
| CONF-P2-001 | P2 | Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy | @owner | CONF | open | Add SCHEDULE_DISPATCH_TOKEN to the secrets matrix and SECRETS_ROTATION.md with an owner and 90-day rotation; prefer a re |
| CI-P3-001 | P3 | actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015) | @owner | CI | open | Quote GITHUB_ENV/GITHUB_OUTPUT/GITHUB_STEP_SUMMARY and expression-derived variables; add an actionlint CI job (and optio |
| CI-P3-002 | P3 | Over-broad workflow token permissions (unused write scopes) | @owner | CI | open | Remove unused actions: write / pull-requests: write; scope any genuinely needed write permission to the specific job (de |
| CI-P3-003 | P3 | StrictHostKeyChecking=no in the deploy health check | @owner | CI | open | Pin the droplet host key via a secret and use StrictHostKeyChecking=yes with a known_hosts file (or the host-key configu |
| SEC-P3-001 | P3 | gitleaks generic-api-key/jwt hits are false positives (no tracked secret) | @owner | SEC | open | Commit a .gitleaks.toml allowlisting prompts/manifest.json (hashes), the m365-hardening key and test fixtures; optionall |
| SUPPLY-P3-001 | P3 | Unpinned container images (test/local only); production app images tag-based by design | @owner | SUPPLY | open | Pin the playwright and postgres test images by digest and consider pinning the Supabase local image set; document that a |
| SUPPLY-P3-002 | P3 | Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK | @owner | SUPPLY | open | Add WORKDIR /app to the web runner stage before the COPYs; optionally use exec-form HEALTHCHECK arrays. Add hadolint to  |
| CONF-P3-001 | P3 | Secret rotation policy has no evidence any secret was ever rotated | @owner | CONF | open | Populate the Rotation Log on the next cycle with date, operator, environment and the gh secret set / deploy run URL; hav |
