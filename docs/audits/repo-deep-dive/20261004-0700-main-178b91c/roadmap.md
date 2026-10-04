# Roadmap

- CI-P2-001 (P2) - World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port
- CI-P2-002 (P2) - Deploy-gate secret scan is a no-op on pushes to main
- CI-P2-003 (P2) - Production approval environment documented as having no required reviewers
- PORT-P2-001 (P2) - 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail
- SEC-P2-001 (P2) - Secret scanner echoes the matched secret value into CI logs
- SEC-P2-002 (P2) - Webhook SSRF guard has a DNS-rebinding TOCTOU window
- CONF-P2-001 (P2) - Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy
- CI-P3-001 (P3) - actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015)
- CI-P3-002 (P3) - Over-broad workflow token permissions (unused write scopes)
- CI-P3-003 (P3) - StrictHostKeyChecking=no in the deploy health check
- SEC-P3-001 (P3) - gitleaks generic-api-key/jwt hits are false positives (no tracked secret)
- SUPPLY-P3-001 (P3) - Unpinned container images (test/local only); production app images tag-based by design
- SUPPLY-P3-002 (P3) - Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK
- CONF-P3-001 (P3) - Secret rotation policy has no evidence any secret was ever rotated
