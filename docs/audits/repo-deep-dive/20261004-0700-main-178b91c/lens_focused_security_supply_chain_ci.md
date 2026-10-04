# Focused security / supply-chain / CI deep-dive - mainecybertech

## Findings

| ID | Severity | Title | Report |
|---|---|---|---|
| CI-P2-001 | P2 | World-open DigitalOcean firewall mutation with no approval and unvalidated udp_port | lens_focused_security_supply_chain_ci.md |
| CI-P2-002 | P2 | Deploy-gate secret scan is a no-op on pushes to main | lens_focused_security_supply_chain_ci.md |
| CI-P2-003 | P2 | Production approval environment documented as having no required reviewers | lens_focused_security_supply_chain_ci.md |
| PORT-P2-001 | P2 | 17 tracked shell scripts lack the exec bit; documented ./scripts/... commands fail | lens_focused_security_supply_chain_ci.md |
| SEC-P2-001 | P2 | Secret scanner echoes the matched secret value into CI logs | lens_focused_security_supply_chain_ci.md |
| SEC-P2-002 | P2 | Webhook SSRF guard has a DNS-rebinding TOCTOU window | lens_focused_security_supply_chain_ci.md |
| CONF-P2-001 | P2 | Workflow-scope PAT SCHEDULE_DISPATCH_TOKEN omitted from secret inventory and rotation policy | lens_focused_security_supply_chain_ci.md |
| CI-P3-001 | P3 | actionlint/shellcheck workflow lint issues (SC2086/SC2129/SC2002/SC2015) | lens_focused_security_supply_chain_ci.md |
| CI-P3-002 | P3 | Over-broad workflow token permissions (unused write scopes) | lens_focused_security_supply_chain_ci.md |
| CI-P3-003 | P3 | StrictHostKeyChecking=no in the deploy health check | lens_focused_security_supply_chain_ci.md |
| SEC-P3-001 | P3 | gitleaks generic-api-key/jwt hits are false positives (no tracked secret) | lens_focused_security_supply_chain_ci.md |
| SUPPLY-P3-001 | P3 | Unpinned container images (test/local only); production app images tag-based by design | lens_focused_security_supply_chain_ci.md |
| SUPPLY-P3-002 | P3 | Dockerfile lint: missing WORKDIR in web runner stage and shell-form HEALTHCHECK | lens_focused_security_supply_chain_ci.md |
| CONF-P3-001 | P3 | Secret rotation policy has no evidence any secret was ever rotated | lens_focused_security_supply_chain_ci.md |

---

# mainecybertech — Security / Supply-Chain / CI Deep-Dive (READ-ONLY)

- Repository: `mainecybertech` (MaineCyberTech)
- Branch: `main`
- Commit: `178b91c9a9cf605ab8a21f24337e2e919cb4de6a` ("Merge pull request #69 from MaineCyberTech/chore/wireguard-endpoint-fw2", 2026-10-03)
- Auditor: LLM subagent (focused lens: SEC / SUPPLY / CI), read-only
- Deterministic sources: `lens_deterministic.md`, `deterministic-findings.json` (run `mainecybertech`, generated 2026-10-04)
- Scope limitation: GitHub-side settings (environment required reviewers, branch-protection enforcement, secret values) cannot be read from the repository; those are marked `Unknown` / `unverified`. No production systems were contacted. No secret values are printed.

## Executive Summary

This is a mature, heavily pre-audited repository. The things deterministic scanners flagged are mostly **false positives or low-impact hygiene**, while the higher-value issues are in **CI governance**: a `workflow_dispatch` workflow that mutates a DigitalOcean cloud firewall to be world-open with no environment approval, a deploy-gate secret scan that does not actually scan the main-branch commit it is supposed to protect, and a documented-not-configured production approval environment.

Strengths (evidence-backed): container images pinned by digest for infra services, non-root runtime users, `cap_drop: ALL` + `no-new-privileges`, read-only root filesystems, image-layer Trivy scans with fail-closed exit codes, SBOM generation, build-provenance attestations that are **verified** before deploy (`deploy-do.yml` `verify-attestations`), SHA-pinned GitHub Actions throughout, dependency/lockfile gates, a license policy gate, pinned tool versions, and a real secrets-rotation policy with emergency procedures.

Top findings by severity:

| ID | Sev | Title |
|---|---|---|
| mainecybertech-CI-002 | P2 | `wireguard-endpoint.yml` opens a world-open DigitalOcean firewall rule with no approval and unvalidated `udp_port` |
| mainecybertech-CI-003 | P2 | Deploy-gate secret scan is a no-op on pushes to `main` (empty diff) |
| mainecybertech-PORT-001 | P2 | 17 tracked shell scripts are non-executable; documented `./scripts/...` commands fail (DET-P2-002) |
| mainecybertech-SEC-001 | P2 | Secret scanner prints the matching secret line to CI logs / pre-commit output |
| mainecybertech-CI-004 | P2 | `prod-approval` environment documented as having **no required reviewers configured** |
| mainecybertech-CONF-001 | P2 | `SCHEDULE_DISPATCH_TOKEN` (workflow-scope PAT) missing from the secrets inventory/rotation policy |
| mainecybertech-SEC-003 | P2 | Webhook SSRF guard has a DNS-rebinding TOCTOU (resolved IP is not pinned for the fetch) |
| mainecybertech-CI-001 / CI-005 | P3 | actionlint/shellcheck info-level issues; `StrictHostKeyChecking=no` in deploy health check |
| mainecybertech-SUPPLY-001/002 | P3 | Unpinned non-prod images; hadolint DL3045/DL3025 |
| mainecybertech-SEC-002 | P3 | gitleaks: all 33 reported hits are false positives |

## Deterministic Findings — Validation

| DET | Verdict | Notes |
|---|---|---|
| DET-P2-001 actionlint | **Real (true positive), downgraded to P3** | Reproduced with `actionlint 1.7.12` + `shellcheck 0.9.0`: 20× SC2086 (info), 2× SC2129 (style), 1× SC2002 (style), 1× SC2015 (info). All info/style, no security impact. |
| DET-P2-002 exec bit | **Real (true positive), P2** | 17 tracked `*.sh` at mode `100644` (deterministic evidence listed 15; full set is 17). Docs tell users to run `./scripts/...`, which fails on Linux/macOS. |
| DET-P2-003 gitleaks | **False positive (all tracked hits)** | Ran gitleaks in WSL: 33 hits, 31× `generic-api-key`, 2× `jwt`. Tracked hits are SHA-256 hashes in `prompts/manifest.json`, the module key `m365-hardening`, and a test JWT fixture. 4 additional hits live only in gitignored `supabase/.temp/` (not in the repo). No real secret in tracked content. |
| DET-P3-004 digest pins | **Partially real** | 3 app images use `${IMAGE_TAG}` (attestation-verified pre-deploy, arguably by design); `mcr.microsoft.com/playwright:v1.61.0` (`docker-compose.yml:57`) and `postgres:16-alpine` (`db-restore-test.yml:103`) are genuinely unpinned but test-only. |
| DET-P3-005 hadolint | **Real (true positive), P3** | `apps/web/Dockerfile` runner stage has no `WORKDIR` (DL3045, lines 59–61) and shell-form `HEALTHCHECK CMD` (DL3025, line 68); same DL3025 in api/worker. Cosmetic. |

## Findings

### Finding ID: mainecybertech-CI-002 — World-open firewall mutation with no approval (DO firewall workflow)

- Severity: P2
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/wireguard-endpoint.yml:24` `permissions:` / `:25` `contents: read` (no environment)
  - `.github/workflows/wireguard-endpoint.yml:32` `DROPLET: ${{ inputs.droplet }}` / `:33` `UDP_PORT: ${{ inputs.udp_port }}`
  - `.github/workflows/wireguard-endpoint.yml:70` `curl ... /v2/firewalls/$FID/rules`
  - `.github/workflows/wireguard-endpoint.yml:72` `-d "{\"inbound_rules\":[{\"protocol\":\"udp\",\"ports\":\"$UDP_PORT\",\"sources\":{\"addresses\":[\"0.0.0.0/0\",\"::/0\"]}}]}"`
- What is happening: A `workflow_dispatch` workflow (header describes it as "Read-only listing + add an inbound UDP rule") can POST a new inbound rule to the DigitalOcean cloud firewall. The rule source is hard-coded to `0.0.0.0/0` and `::/0` (world-open). The target droplet (`inputs.droplet`) and `inputs.udp_port` are caller-controlled; `udp_port` is interpolated into a JSON request body with no validation.
- Why it matters: Anyone with repository write access can open an arbitrary UDP port to the entire internet on any droplet in the account, including `mct-portal-prod` (the defaults use `mct-portal-dev`, but `droplet` is free-form and resolves by name/prefix at `:57`–`:58`). The workflow also runs with the broad, long-lived `DO_API_TOKEN` (`:31`) that governs all DigitalOcean infrastructure. There is no `environment:` gate, so no required-reviewer approval is possible. The `udp_port` value is placed raw inside the JSON body (`:72`), so a crafted value containing `"` / `}` can add further, unplanned rules to the request.
- Recommended fix: Add `environment: prod-approval` (or a dedicated `firewall-approval`) to the job; restrict the target droplet to an explicit `choice` allow-list; validate `udp_port` against `/^[0-9]{1,5}$/` and a documented allow-list, and build the JSON with `jq -n --argjson` rather than string interpolation; prefer narrowing `sources` to known lab/VPN CIDRs, add an explicit expiry/removal path and an audit step; consider splitting the mutation into a separate least-privilege workflow and token.
- Suggested validation: Add a workflow-lint test asserting every job that calls `POST /v2/firewalls/*/rules` has an `environment:` and a validated port; unit-test the `jq -n` body builder.
- Deterministic reference: none

### Finding ID: mainecybertech-CI-003 — Deploy-gate secret scan does not scan the main-branch commit

- Severity: P2
- Confidence: Medium
- Area: CI
- Evidence:
  - `.github/workflows/validate.yml:43` comment: "Runs as part of the deploy gate so a leaked credential cannot ship even if PR-only checks were bypassed."
  - `.github/actions/secret-scan/action.yml:15` `if [ "${{ github.event_name }}" = "pull_request" ]; then`
  - `.github/actions/secret-scan/action.yml:18` `BASE="$(git merge-base HEAD origin/main 2>/dev/null || echo HEAD~1)"`
  - `.github/actions/secret-scan/action.yml:20` `DIFF=$(git diff -U0 "$BASE" HEAD 2>/dev/null || git diff -U0 HEAD~1 HEAD)`
- What is happening: For non-PR events the scan compares `HEAD` to `git merge-base HEAD origin/main`. On a `push` to `main` (which is exactly how `deploy-do.yml` deploys prod, `deploy-do.yml:16`–`17`, and how `validate.yml` is invoked as the deploy gate), `origin/main` equals `HEAD`, so `merge-base` is `HEAD` and `git diff HEAD HEAD` is empty. The scan then reports 0 matches regardless of content. The `|| echo HEAD~1` fallback only triggers if `merge-base` fails, not when the base equals HEAD.
- Why it matters: The stated defence-in-depth — catching a secret that bypassed PR checks — does not run on the production-bound `main` push. A direct/admin push to `main` (or a merge whose PR-side scan was skipped) ships without a deploy-gate secret scan.
- Recommended fix: For `push` events use `github.event.before` (fall back to `HEAD~1` when it is all-zeros, e.g. first push), or explicitly `git diff "${{ github.event.before }}" HEAD`; add a test that a known fake secret fails the `push` path.
- Suggested validation: Unit/repo test that runs the action logic against a synthetic push diff containing a fake token and asserts exit 1.
- Deterministic reference: none

### Finding ID: mainecybertech-PORT-001 — Tracked shell scripts lack the exec bit; documented `./scripts/...` invocations fail

- Severity: P2
- Confidence: High
- Area: PORT
- Evidence:
  - `README.md:95` `./scripts/start-local-stack.sh         # Linux/macOS`
  - `docs/ROLLBACK_PROCEDURES.md:141` `SUPABASE_DB_URL=postgresql://... ./scripts/restore-database.sh --dry-run`
  - `docs/ROLLBACK_PROCEDURES.md:175` `./scripts/restore-storage.sh --dry-run`
  - `git ls-files -s`: `scripts/restore-database.sh`, `scripts/restore-storage.sh`, `scripts/start-local-stack.sh` (and 14 others) are mode `100644`; only `scripts/scan-secrets.sh` is `100755`.
- What is happening: 17 tracked shell scripts are stored without the executable bit. `git ls-files -s` shows `100644` for `infra/digitalocean/redis-entrypoint.sh`, all four `prompts/portal-alignment/...` scripts, `scripts/backup-database.sh`, `scripts/backup-storage.sh`, `scripts/dev-setup.sh`, `scripts/local_dev_reset_and_verify.automated.v2.sh`, `scripts/preflight-check.sh`, `scripts/restore-database.sh`, `scripts/restore-storage.sh`, `scripts/rollback.sh`, `scripts/start-local-stack.sh`, `scripts/teardown-local-stack.sh`, `scripts/test-local-seeds.sh`, `scripts/validate-terraform-env.sh`, `tools/migration_chain_check.sh`.
- Why it matters: CI invokes the backup scripts via `bash scripts/...` (`db-backup.yml:39`, `storage-backup.yml:46`), so CI is unaffected — but operator documentation tells humans to run them directly (`./scripts/...`), which fails with "Permission denied" on Linux/macOS. This is most dangerous in `docs/ROLLBACK_PROCEDURES.md`, used during incidents.
- Recommended fix: `git update-index --chmod=+x` the 17 scripts (and commit); add a CI check (`git ls-files -s | awk '$1==100644 && /\.sh$/'` must be empty).
- Suggested validation: CI job asserting no tracked `*.sh` is `100644`; smoke-run `./scripts/restore-database.sh --dry-run`.
- Deterministic reference: DET-P2-002

### Finding ID: mainecybertech-SEC-001 — Secret scanner echoes the matched secret to CI logs

- Severity: P2
- Confidence: High
- Area: SEC
- Evidence:
  - `.github/actions/secret-scan/action.yml:21` `MATCHES=$(printf '%s' "$DIFF" | grep -E "^\+" | ... | grep -cE "$PATTERNS" ...)`
  - `.github/actions/secret-scan/action.yml:24` `printf '%s' "$DIFF" | grep -nE "^\+.*($PATTERNS)" | ... || true`
  - `scripts/scan-secrets.sh:27` `... | grep -nE "^\+.*($PATTERNS)" | ... while IFS= read -r line; do echo "    $line"`
- What is happening: When a pattern matches, the scanner prints the offending **added line verbatim**, including the secret value. This is the CI `secrets-scan` job (deploy gate) and the pre-commit hook.
- Why it matters: The stated goal is leak prevention, but the failure path writes the secret into GitHub Actions logs (retained, exportable, and partially visible to anyone who can read Actions) and into the developer's terminal/pre-commit output. It converts a blocked commit/run into a logged exposure.
- Recommended fix: Print only the file, line number, and rule name; mask with `::add-mask::` before any echo; never print `$DIFF`. Apply the same change to `scripts/scan-secrets.sh`.
- Suggested validation: Test asserting the scanner's output contains no matched value for a synthetic token.
- Deterministic reference: none (complements DET-P2-003)

### Finding ID: mainecybertech-SEC-002 — gitleaks findings are false positives (no tracked secret)

- Severity: P3
- Confidence: High
- Area: SEC
- Evidence:
  - `prompts/manifest.json:182` `"mct-full-webstore-product-catalog-pack/prompts/08_DATABASE_AND_API_OPTIONAL.md": "ee0c9ead..."`
  - `apps/web/lib/navigation/portal-nav.ts:178` `key: "m365-hardening",`
  - `docs/features/m365-hardening.md:15` ``Permission module key: `m365-hardening` (view / create / edit / delete)``
  - `supabase/migrations/5302128_role_catalog_expansion.sql:101` `or (p.module_key = 'm365-hardening' and ...)`
  - `.github/workflows/e2e.yml:107` `echo "JWT_SECRET=e2e-test-secret-32-characters-long" >> $API_ENV`
- What is happening: Running gitleaks (`detect --no-git`) produced 33 hits: 31× `generic-api-key`, 2× `jwt`. All tracked hits are (a) SHA-256 content hashes in `prompts/manifest.json`, (b) the string `m365-hardening`, and (c) the deliberately weak e2e test JWT. The 2 `jwt` hits and 2 of the `generic-api-key` hits are under `supabase/.temp/start-secrets/.../docker.env`, which `.gitignore:37` (`supabase/.temp/`) excludes; it is a local `supabase start` artifact, not repo content.
- Why it matters: Not a leak. But because the repo ships **no `.gitleaks.toml`** and does not run gitleaks, external/occasional gitleaks runs stay noisy and erode signal trust.
- Recommended fix: Commit a `.gitleaks.toml` allowlisting `prompts/manifest.json` (hashes), the `m365-hardening` key, and test fixtures; optionally run gitleaks in CI with that config for high-confidence rules only.
- Suggested validation: `gitleaks detect --no-git --config .gitleaks.toml` returns 0 on a clean checkout.
- Deterministic reference: DET-P2-003

### Finding ID: mainecybertech-SEC-003 — Webhook SSRF guard has a DNS-rebinding TOCTOU window

- Severity: P2
- Confidence: Medium
- Area: SEC
- Evidence:
  - `apps/api/src/lib/ssrf-guard.ts:81` `export async function assertSafeWebhookUrl(url: string): Promise<void>`
  - `apps/api/src/lib/ssrf-guard.ts:94` `addresses = await dns.promises.lookup(hostname, { all: true });`
  - `apps/api/src/lib/webhook-dispatcher.ts:48` `await assertSafeWebhookUrl(url);`
  - `apps/api/src/lib/webhook-dispatcher.ts:51` `res = await fetch(url, {`
  - `apps/api/src/routes/webhook-management.ts:461` `await assertSafeWebhookUrl(webhook.url);` then `:466` `const res = await fetch(webhook.url, {`
- What is happening: The guard resolves the hostname and rejects private addresses, then the code calls `fetch(url)` which resolves the **same hostname again**. An attacker-controlled DNS name can return a public address for the guard's lookup and a private/loopback address for the fetch (classic DNS rebinding). `redirect: "manual"` closes the redirect variant but not the rebinding one.
- Why it matters: A tenant user who can configure a webhook URL can reach internal services (e.g. the Supabase/Redis/cloud metadata endpoints reachable from the API/worker network) via rebinding, defeating a control the code explicitly claims ("defense against DNS rebinding to internal hosts").
- Recommended fix: Resolve once, then connect to the validated IP with the `Host` header preserved (custom `lookup`/`undici` dispatcher or `ssrf-req-filter`), or re-validate the resolved IP at connect time and reject if it changed; block link-local/metadata explicitly. Apply the same pattern in `webhook-management.ts`.
- Suggested validation: Integration test with a DNS name that alternates public/private answers across lookups; assert the outbound request is rejected.
- Deterministic reference: none

### Finding ID: mainecybertech-CI-004 — Production approval gate documented as not configured

- Severity: P2
- Confidence: Medium
- Area: CI
- Evidence:
  - `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:9` ``- `prod-approval` — Attached by the production-mutating jobs ...``
  - `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:11` `**Required reviewers (1+) must be configured in GitHub**`
  - `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:12` `Environments → \`prod-approval\`); none are configured yet, so the approval`
  - `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md:13` `gate is not yet in force.`
  - `.github/workflows/deploy-do.yml:486` `environment: ${{ needs.setup.outputs.name == 'prod' && 'prod-approval' || 'dev' }}` (comment at `:482`–`:485` notes the gate "cannot be enforced from this file")
- What is happening: The repository's own matrix states that `prod-approval` has no required reviewers yet, so the environment approval it is meant to impose is not in force. `deploy-do.yml` auto-deploys prod on push to `main` (`:16`–`:17`), and `supabase-migrations.yml` runs prod migrations under the unprotected `prod` environment (`supabase-migrations.yml:30`).
- Why it matters: Production deploy and prod DB migration execution rely solely on branch protection (1 code-owner review) and have no second human gate. A compromised maintainer account with merge rights, or a mis-scoped push to `main`, reaches production without an approval prompt. This cannot be verified or fixed from the repo alone.
- Recommended fix: Configure `prod-approval` with 1+ required reviewers (and ideally restrict who can approve) in GitHub Settings → Environments; move prod migrations under `prod-approval` too; then update `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` and add a runbook verification step.
- Suggested validation: Screenshot/export of the `prod-approval` environment showing required reviewers; a test that a prod dispatch pauses for approval.
- Deterministic reference: none

### Finding ID: mainecybertech-CONF-001 — Workflow-scope PAT omitted from the secret inventory and rotation policy

- Severity: P2
- Confidence: High
- Area: CONF
- Evidence:
  - `.github/workflows/backup-dispatch.yml:13` `needs a \`SCHEDULE_DISPATCH_TOKEN\` secret (a PAT or GitHub App token with`
  - `.github/workflows/backup-dispatch.yml:14` `` `actions: write`).``
  - `.github/workflows/backup-dispatch.yml:62` `TOKEN: ${{ secrets.SCHEDULE_DISPATCH_TOKEN }}`
  - `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` contains no `SCHEDULE_DISPATCH_TOKEN` row (only `SLACK_WEBHOOK_URL` for the backup workflows)
  - `docs/SECRETS_ROTATION.md:9`–`:57` inventory has no `SCHEDULE_DISPATCH_TOKEN`
- What is happening: `backup-dispatch.yml` requires a `SCHEDULE_DISPATCH_TOKEN` with GitHub Actions `workflow` dispatch capability (a PAT or GitHub App token), but it appears in neither the secrets matrix nor the rotation inventory (only `AGENTS.md:109` and `docs/CI.md:26` mention it as an operator prerequisite).
- Why it matters: A long-lived PAT with workflow-dispatch scope is a high-value credential (it can trigger privileged workflows). An uninventoried credential will not be rotated or revoked during an incident, and its absence/presence isn't tracked as a control.
- Recommended fix: Add `SCHEDULE_DISPATCH_TOKEN` to `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` and `docs/SECRETS_ROTATION.md` with a 90-day rotation and an owner; prefer a GitHub App installation token with a short expiry over a classic PAT; scope it to this repository only.
- Suggested validation: `git grep -c SCHEDULE_DISPATCH_TOKEN docs/` returns both docs; a `secret-rotation-reminder` checklist references it.
- Deterministic reference: none

### Finding ID: mainecybertech-CONF-002 — Rotation policy has no evidence of a single rotation

- Severity: P3
- Confidence: High
- Area: CONF
- Evidence:
  - `docs/SECRETS_ROTATION.md:221` `## Rotation Log`
  - `docs/SECRETS_ROTATION.md:225` `| (Initial deployment) | All | — | No | dev, prod |`
  - `docs/SECRETS_ROTATION.md:227` `Update this table after each rotation event.`
- What is happening: The rotation log contains only the initial-deployment row; no secret has a recorded rotation date, and `DO_API_TOKEN`/`CLOUDFLARE_API_TOKEN`/etc. are 180-day secrets with no evidence they were rolled.
- Why it matters: The policy is thorough but "configured, not exercised". For 90-day secrets (JWT, Stripe, Jira/JSM tokens, Supabase access token, SSH key, METRICS_TOKEN) there is no verifiable artifact that rotation occurred.
- Recommended fix: Populate the log on the next rotation cycle; attach the `gh secret set`/deploy run URL; make `secret-rotation-reminder.yml`'s issue checklist require the log update (it already asks for it) and have a reviewer confirm.
- Suggested validation: A dated Rotation Log entry with a linked Actions run.
- Deterministic reference: none

### Finding ID: mainecybertech-CI-005 — Over-broad workflow token permissions

- Severity: P3
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/terraform-do.yml:19` `pull-requests: write` and `:20` `actions: write` (workflow only triggers on `workflow_dispatch`, `:9`; the PR-comment step at `:126`–`:140` is unreachable because there is no `pull_request` trigger)
  - `.github/workflows/e2e.yml:32` `actions: write`
  - `.github/workflows/a11y-breadth.yml:16` `actions: write`
  - `.github/workflows/deploy-do.yml:36` `actions: write`
- What is happening: Multiple workflows grant write scopes that no step demonstrably consumes (`actions: write` for upload-artifact/attestation does not require it; `pull-requests: write` on a dispatch-only workflow guards dead code). Top-level permissions apply to every job, including ones that only check out code.
- Why it matters: Any compromise of a step (e.g. a dependency or an action) inherits unnecessary write capability; least privilege reduces blast radius and is a required baseline for CI hardening.
- Recommended fix: Remove `actions: write`/`pull-requests: write` where unused; if artifact/attestation attachment turns out to need a scope, document it and scope it to the specific job (`deploy-do.yml` already does job-level scoping for `verify-attestations`). Re-run actionlint.
- Suggested validation: actionlint and a `zizmor`-style audit report zero over-privileged scopes; confirm each retained write scope has a consuming step.
- Deterministic reference: none

### Finding ID: mainecybertech-CI-006 — `StrictHostKeyChecking=no` in the deploy health check

- Severity: P3
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/deploy-do.yml:777` `SSH="ssh -i $KEY_FILE -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$DROPLET_IP"`
- What is happening: The post-deploy worker health check disables host-key verification. The IP comes from `resolve-ip` (DO API / Terraform state), but the SSH connection is still unauthenticated against the host key, so the private deploy key could be presented to a spoofed host if the IP were poisoned.
- Why it matters: A MITM on that path could capture the ephemeral use of `CI_SSH_PRIVATE_KEY` (which is a root SSH key) and/or feed false health results. Low likelihood, but trivially avoidable.
- Recommended fix: Pin the droplet host key via `secrets.DROPLET_HOST_KEY` and use `StrictHostKeyChecking=yes` + a `known_hosts` file, or use the same `appleboy/ssh-action` host-key configuration already used by the setup/deploy steps.
- Suggested validation: Health-check step succeeds with `StrictHostKeyChecking=yes` against a known `known_hosts`.
- Deterministic reference: none

### Finding ID: mainecybertech-CI-001 — actionlint/shellcheck workflow lint issues

- Severity: P3
- Confidence: High
- Area: CI
- Evidence:
  - `.github/workflows/build-push.yml:26` `run: |` → SC2086 (unquoted `$GITHUB_ENV` at `:27`–`:28`); also `:99` and `:169`
  - `.github/workflows/deploy-do.yml:72` `run: |` → 9× SC2086 + SC2129; `:130` → SC2086
  - `.github/workflows/terraform-do.yml:47` → 2× SC2086; `:209`, `:249` → SC2086
  - `.github/workflows/wireguard-endpoint.yml:53` → SC2015
  - `.github/workflows/e2e.yml:98`, `:117` → SC2129, SC2002
- What is happening: Reproduced by running `actionlint 1.7.12` with `shellcheck 0.9.0` on the current `main`: 20× SC2086 (info, unquoted expansions such as `>> $GITHUB_ENV`), 2× SC2129 (style), 1× SC2002 (style), 1× SC2015 (info). All are info/style; the unquoted values (`GITHUB_ENV`, `GITHUB_OUTPUT`) cannot contain whitespace.
- Why it matters: No functional or security impact, but the code is not lint-clean and the repo has no actionlint job, so future real errors (e.g. expression injection, bad `needs`) won't be caught.
- Recommended fix: Quote the redirects (`>> "$GITHUB_ENV"`, `>> "$GITHUB_OUTPUT"`, `>> "$GITHUB_STEP_SUMMARY"`) and the `${{ ... }}`-derived variables; add an `actionlint` job to CI (ideally also `zizmor` for security-specific workflow checks).
- Suggested validation: `actionlint` exits 0 in CI.
- Deterministic reference: DET-P2-001

### Finding ID: mainecybertech-SUPPLY-001 — Unpinned container images (partial)

- Severity: P3
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `docker-compose.yml:57` `image: mcr.microsoft.com/playwright:v1.61.0`
  - `.github/workflows/db-restore-test.yml:103` `postgres:16-alpine`
  - `infra/digitalocean/docker-compose.yml:61` `${GHCR_IMAGE_PREFIX:-...}/mct-api:${IMAGE_TAG:?IMAGE_TAG must be set}`
  - `.github/workflows/e2e.yml:74` `npm install -g supabase@2.107.0` (`supabase start` then pulls ~13 Docker Hub images, `:77`)
- What is happening: The production infra services are digest-pinned (`infra/digitalocean/docker-compose.yml:28`, `:186`, `:219`, `:273`), but the local/test images `mcr.microsoft.com/playwright:v1.61.0` and `postgres:16-alpine` are tag-only, and `supabase start` pulls floating images. The three app images use `${IMAGE_TAG}` by design.
- Why it matters: For test/local tooling the risk is reputation/nondeterminism rather than prod tamper (production is protected by tag→digest resolution plus `gh attestation verify`, `deploy-do.yml:407`–`:451`). But a compromised tag in CI can execute in the runner.
- Recommended fix: Pin the playwright and postgres test images by digest; consider pinning the Supabase CLI's local image set. Optionally document why app images are tag-based (attestation-verified).
- Suggested validation: A check that every `image:` in compose files either has `@sha256:` or is on the documented allow-list.
- Deterministic reference: DET-P3-004

### Finding ID: mainecybertech-SUPPLY-002 — Dockerfile lint: missing WORKDIR and shell-form HEALTHCHECK

- Severity: P3
- Confidence: High
- Area: SUPPLY
- Evidence:
  - `apps/web/Dockerfile:37` `FROM node:20-alpine@sha256:... AS runner` (new stage, does not inherit `base`'s `WORKDIR /app`)
  - `apps/web/Dockerfile:59`–`:61` `COPY --from=builder --chown=nextjs:nodejs ... ./` (relative dest, no `WORKDIR`)
  - `apps/web/Dockerfile:68` `CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1` (shell form inside HEALTHCHECK)
  - `apps/api/Dockerfile:58`, `apps/worker/Dockerfile:57` same shell-form HEALTHCHECK
- What is happening: hadolint DL3045 (COPY to relative dest without WORKDIR) in the web runner stage and DL3025 (non-JSON CMD/ENTRYPOINT) for the healthchecks.
- Why it matters: Cosmetic/reliability. The web image currently relies on copying into `/` and invoking `node apps/web/server.js`, which works but is brittle; shell-form `HEALTHCHECK CMD` is acceptable but not parseable as JSON.
- Recommended fix: Add `WORKDIR /app` to the web runner stage before the COPYs (and reference files relative to it); optionally switch healthchecks to exec-form arrays (`["CMD","wget",...]`).
- Suggested validation: `hadolint apps/*/Dockerfile` clean (or documented ignores).
- Deterministic reference: DET-P3-005

## Real vs False Positive Summary

- Real (true positives): DET-P2-001 (downgraded P3), DET-P2-002, DET-P3-005; plus LLM: CI-002, CI-003, CI-004, CI-005, CI-006, SEC-001, SEC-003, CONF-001, CONF-002.
- Partially real: DET-P3-004.
- False positive: DET-P2-003 (all tracked gitleaks hits; 4 additional hits are in a gitignored local `supabase/.temp/` artifact, not in the repo).

## Counts by Severity

- P0: 0
- P1: 0
- P2: 7 (CI-002, CI-003, CI-004, PORT-001, SEC-001, SEC-003, CONF-001)
- P3: 7 (CI-001, CI-005, CI-006, SEC-002, SUPPLY-001, SUPPLY-002, CONF-002)
- Total: 14

## Risks / Open Questions

- `Unknown` / `unverified`: GitHub environment required reviewers, branch-protection enforcement, secret values and their true ages. The repository only declares these in JSON/docs; GitHub is the source of truth. The matrix itself states the approval gate is not configured.
- `Unknown`: whether `DO_API_TOKEN`, `CI_SSH_PRIVATE_KEY`, and `SCHEDULE_DISPATCH_TOKEN` are scoped/least-privilege in GitHub (cannot be read from repo).
- `Unknown`: whether the branch-protection JSON in `.github/branch-protection/*.json` is actually applied; `scripts/check-required-checks.mjs` only validates check-name resolution, not that protection is enabled on GitHub.
- Verify: `supabase-migrations.yml` runs prod migrations under the unprotected `prod` environment on push to `main` — confirm this is intended versus `prod-approval`.

## Recommendations (priority order)

1. Gate `wireguard-endpoint.yml` behind an environment + validate `udp_port`, or retire it (CI-002).
2. Fix the deploy-gate secret scan to use the push base SHA (CI-003).
3. Stop printing matched secret values in `secret-scan` and `scan-secrets.sh` (SEC-001).
4. Configure `prod-approval` required reviewers and cover prod migrations (CI-004).
5. `chmod +x` the 17 scripts and add a CI guard (PORT-001).
6. Inventory and 90-day-rotate `SCHEDULE_DISPATCH_TOKEN`; replace PAT with a short-lived GitHub App token (CONF-001).
7. Pin test images and fix DNS-rebinding in the SSRF guard (SUPPLY-001, SEC-003).
8. Add `.gitleaks.toml`, actionlint + zizmor CI jobs, and trim unused `actions: write`/`pull-requests: write` (SEC-002, CI-001, CI-005).
