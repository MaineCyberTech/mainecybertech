# Follow-up register

| Finding | Severity | Title | Owner | Target | Status | Note |
|---|---|---|---|---|---|---|
| CI-P2-001 | P2 | World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port | @owner | CI | verified-fixed | removed mainecybertech#78 @ 5230494 - the one-time DO firewall workflow was deleted, removing the unapproved mutation path |
| CI-P2-002 | P2 | Deploy-gate secret scan is a no-op on pushes to main | @owner | CI | verified-fixed | merged mainecybertech#75 @ 9cc582f |
| CI-P2-003 | P2 | Production approval environment documented as having no required reviewers | @owner | CI | verified-fixed | merged mainecybertech#80 @ cd13108 |
| PORT-P2-001 | P2 | 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail | @owner | PORT | verified-fixed | merged mainecybertech#74 @ 54c76a3 |
| SEC-P2-001 | P2 | Secret scanner echoes the matched secret value into CI logs | @owner | SEC | verified-fixed | merged mainecybertech#76 @ d0dec1e |
| SEC-P2-002 | P2 | Webhook SSRF guard has a DNS-rebinding TOCTOU window | @owner | SEC | verified-fixed | merged mainecybertech#81 @ dc4ecb1 |
| CONF-P2-001 | P2 | Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy | @owner | CONF | verified-fixed | merged mainecybertech#77 @ f313947 |
| CI-P3-001 | P3 | actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015) | @owner | CI | verified-fixed | merged mainecybertech#87 @ 93cdc99 - actionlint config + quoted GITHUB_ENV/GITHUB_OUTPUT |
| CI-P3-002 | P3 | Over-broad workflow token permissions (unused write scopes) | @owner | CI | verified-fixed | merged mainecybertech#85 @ 84c5dbd - unused actions: write dropped |
| CI-P3-003 | P3 | StrictHostKeyChecking=no in the deploy health check | @owner | CI | verified-fixed | merged mainecybertech#94 @ 682c174 + #95 @ ca33aca - SSH host key pinned (fingerprint + known_hosts); verified by deploy run 37251301833 |
| SEC-P3-001 | P3 | gitleaks generic-api-key/jwt hits are false positives (no tracked secret) | @owner | SEC | verified-fixed | merged mainecybertech#90 @ 429d32b - .gitleaks.toml allowlists + fail-closed config verifier |
| SUPPLY-P3-001 | P3 | Unpinned container images (test/local only); production app images tag-based by design | @owner | SUPPLY | verified-fixed | merged mainecybertech#89 @ 94fa170 - playwright pinned by digest; no postgres image in-repo (Supabase CLI manages its own set) |
| SUPPLY-P3-002 | P3 | Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK | @owner | SUPPLY | verified-fixed | merged mainecybertech#88 @ f21d383 - hadolint DL3045/DL3025 fixed (explicit WORKDIR) |
| CONF-P3-001 | P3 | Secret rotation policy has no evidence any secret was ever rotated | @owner | CONF | open | Populate the Rotation Log on the next cycle with date, operator, environment and the gh secret set / deploy run URL; hav |
