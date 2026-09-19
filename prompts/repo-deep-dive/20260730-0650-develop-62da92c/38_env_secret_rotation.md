# Environment and Secret Rotation Audit

## Audit Metadata

- Audit name: repo-deep-dive
- Run: 20260730-0650-develop-62da92c
- Repository: mainecybertech/mainecybertech (monorepo)
- Branch: develop
- Commit SHA: 62da92c
- Generated at: 2026-07-30
- Auditor: Principal Repository Auditor (AI)
- Area code: SECRET
- Output path: docs/audits/repo-deep-dive/20260730-0650-develop-62da92c/38_env_secret_rotation.md
- Scope limitations: No access to actual GitHub Secrets, Supabase dashboard, or production `.env` file. Analysis based on `.env.example` files, Zod env schemas, CI workflow secrets references, rotation documentation, and code.

## Scope

Reviewed all `.env.example` files (3 apps + docker-compose), Zod env validation schemas (API + Worker), `docs/ENVIRONMENT_VARIABLES.md`, `docs/SECRETS_ROTATION.md`, `docs/JWT_ROTATION.md`, CI workflow secret references, Terraform secret variable patterns, and GitHub Actions secret usage.

## Evidence Reviewed

| Evidence | Type | Why relevant | Notes |
|----------|------|-------------|-------|
| `apps/api/.env.example` | Config | API env template | 28 vars, free of real secrets |
| `apps/web/.env.example` | Config | Web env template | 7 vars, NEXT_PUBLIC_* only |
| `apps/worker/.env.example` | Config | Worker env template | 28 vars, free of real secrets |
| `infra/digitalocean/.env.example` | Config | DO production template | 34 vars documented |
| `apps/api/src/config/env.ts` | Schema | API runtime validation | Zod, 33 vars, lazy singleton |
| `apps/worker/src/env.ts` | Schema | Worker runtime validation | Zod, 30 vars, eager parse on import |
| `docs/ENVIRONMENT_VARIABLES.md` | Doc | Comprehensive env reference | 207 lines, all services covered |
| `docs/SECRETS_ROTATION.md` | Doc | Rotation policy | 40 secrets, 199 lines, procedures |
| `docs/JWT_ROTATION.md` | Doc | JWT rotation procedure | Zero-downtime multi-secret approach |
| `.github/workflows/deploy-do.yml` | CI | Secret injection method | SSH heredoc writes .env file |
| `.github/workflows/terraform-do.yml` | CI | Terraform secret handling | Dynamic tfvars creation |
| `infra/terraform/digitalocean/variables.tf` | IaC | Terraform secret vars | sensitive = true on tokens |

## Executive Summary

The environment variable and secret management system is well-documented and follows best practices overall. All 3 application `.env.example` files exist and are free of real secret values. The API and Worker have Zod-based runtime validation that fails fast on missing required vars. `docs/ENVIRONMENT_VARIABLES.md` is comprehensive (207 lines) covering 40+ variables across all services. `docs/SECRETS_ROTATION.md` is thorough with 40 secrets inventoried, rotation frequencies, procedures for each category, and an emergency rotation plan. `docs/JWT_ROTATION.md` documents a zero-downtime multi-secret rotation strategy. The CI workflow injects secrets via SSH heredoc with `chmod 600` on the resulting `.env` file.

### Key Gaps
- 3 secrets exist in code/env schemas but are missing from `ENVIRONMENT_VARIABLES.md`: `API_PORT`, `TURNSTILE_SECRET_KEY`, webhook secrets (`JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, `M365_WEBHOOK_SECRET`)
- `SECRETS_ROTATION.md` references a non-existent automation workflow (secret-rotation-reminder.yml)
- No `.env` file validation for Next.js web app (no Zod schema)
- Webhook secrets not in rotation documentation
- Redis password has a hardcoded default (`mct-redis-dev`) in docker-compose.yml
- No automated secret rotation reminder — the doc shows a YAML example but the workflow doesn't exist
- Terraform tfvars files contain placeholder values that would fail if used directly

### Strengths
- All `.env.example` files free of real secrets
- Zod runtime validation in API and Worker with `safeParse` for clear error messages
- `docs/SECRETS_ROTATION.md` is comprehensive with 40 secrets inventoried, frequencies, and step-by-step procedures
- Zero-downtime JWT rotation via multi-secret support documented in `docs/JWT_ROTATION.md`
- Worker env.ts has `dotenv.config({ path: ".env.local" })` for local dev
- Sensitive Terraform variables marked `sensitive = true`
- `chmod 600` on droplet `.env` file after deploy
- `NEXT_PUBLIC_*` vars properly scoped to client-side exposure

## Domain Scorecard

| Category | Score | Evidence | Gap | Recommended action |
|----------|:-----:|----------|-----|-------------------|
| .env.example | 5 | All 4 files (3 apps + DO) | None | — |
| Env docs | 4 | ENVIRONMENT_VARIABLES.md | 3+ secrets missing from docs | Add missing vars |
| Runtime validators | 4 | Zod in API (getEnv) + Worker (envSchema) | Web has no runtime validation | Add basic web env check |
| CI/deploy/local secrets | 4 | GitHub Environment Secrets | Secrets written to disk file | Evaluate secrets manager |
| API/JWT/DB/Supabase/... keys | 3 | Comprehensive rotation doc | 3+ webhook secrets missing from doc | Add to rotation doc |
| Naming consistency | 4 | Consistent UPPER_CASE naming | None | — |
| Client-exposed vars | 5 | Only NEXT_PUBLIC_* exposed | None | — |
| Rotation/revocation docs | 4 | SECRETS_ROTATION.md + JWT_ROTATION.md | No automated scheduler | Create reminder workflow |
| Break-glass | 3 | Emergency rotation in SECRETS_ROTATION.md | No separate break-glass runbook | Create runbook |

## Detailed Review

### Item: ENVIRONMENT_VARIABLES.md completeness

- Evidence: `docs/ENVIRONMENT_VARIABLES.md` lines 1-207
- What it does: Documents all environment variables across all 3 services, plus E2E and Docker Compose
- Current coverage (from code):
  - API env.ts has 33 vars — 5 are missing from docs: `API_PORT`, `TURNSTILE_SECRET_KEY`, `JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, `M365_WEBHOOK_SECRET`
  - Worker env.ts has 30 vars — all documented
  - Web .env.example has 7 vars — all documented
- Gap: 5 API environment variables exist in code but are not documented in the central reference

### Item: Secret Exposure Surface

- Evidence: deploy-do.yml lines 200-233 (SSH heredoc)
- What it does: All secrets are injected via SSH heredoc by the CI workflow and written to `/opt/mct-portal/.env` with `chmod 600`
- Risk: Secrets exist as a plaintext file on disk on the droplet. If the droplet is compromised, all secrets are exposed.
- Current controls: `chmod 600`, SSH-only access, Cloudflare-only firewall on HTTP/S
- Missing controls: No secrets manager (Vault, Doppler, 1Password CLI); no file encryption at rest

## Findings

### Finding ID: SECRET-P2-001 - 5 API env vars missing from ENVIRONMENT_VARIABLES.md

- Severity: P2 - Medium
- Confidence: High
- Area: Documentation
- Evidence:
  - `apps/api/src/config/env.ts` lines 4 (API_PORT), 32 (TURNSTILE_SECRET_KEY), 29 (JIRA_WEBHOOK_SECRET), 30 (JSM_WEBHOOK_SECRET), 31 (M365_WEBHOOK_SECRET)
  - `docs/ENVIRONMENT_VARIABLES.md` lines 23-55 (API section) — none of these listed
- What is happening: 5 environment variables that the API Zod schema validates exist in code but are not documented in the central environment variable reference.
- Why it matters: Operators and developers rely on ENVIRONMENT_VARIABLES.md for environment setup. Missing vars cause confusion and setup errors.
- User / business impact: Setup confusion, potential missed configuration.
- Recommended fix: Add the following rows to the API section of ENVIRONMENT_VARIABLES.md:
  - `API_PORT` (No, `4000`, Port the API server listens on)
  - `TURNSTILE_SECRET_KEY` (No, —, Cloudflare Turnstile secret key for contact form)
  - `JIRA_WEBHOOK_SECRET` (No, —, Jira webhook HMAC secret)
  - `JSM_WEBHOOK_SECRET` (No, —, JSM webhook HMAC secret)
  - `M365_WEBHOOK_SECRET` (No, —, M365 webhook HMAC secret)
- Suggested validation: Cross-reference api/src/config/env.ts with ENVIRONMENT_VARIABLES.md.
- Owner suggestion: Platform team
- Effort estimate: 30 minutes
- Status: Open

### Finding ID: SECRET-P2-002 - Secret rotation reminder workflow referenced but does not exist

- Severity: P2 - Medium
- Confidence: High
- Area: Documentation / Automation
- Evidence:
  - `docs/SECRETS_ROTATION.md` lines 168-191: Contains a full YAML example for a `secret-rotation-reminder.yml` but says "scheduled workflow creates an issue quarterly"
  - No `.github/workflows/secret-rotation-reminder.yml` exists
- What is happening: The rotation documentation references an automation workflow that doesn't exist. The YAML is embedded as an example but there's no code to actually run it.
- Why it matters: Without automation, secret rotation is a manual process that relies on calendar reminders. It's likely to be forgotten or delayed.
- User / business impact: Secrets may not be rotated on schedule, increasing exposure risk from credential leaks.
- Recommended fix: Create `.github/workflows/secret-rotation-reminder.yml` based on the example in the doc.
- Suggested validation: Workflow runs on schedule and creates an issue.
- Owner suggestion: Platform team
- Effort estimate: 30 minutes
- Status: Open

### Finding ID: SECRET-P2-003 - Web app has no runtime environment validation

- Severity: P2 - Medium
- Confidence: High
- Area: Runtime Validation
- Evidence:
  - `apps/web/` — no env.ts, no Zod schema, no runtime env validation
  - `apps/api/src/config/env.ts` — Zod validation exists
  - `apps/worker/src/env.ts` — Zod validation exists
- What is happening: The web app relies on Next.js to expose `NEXT_PUBLIC_*` vars but performs no startup validation to ensure required env vars are set. Missing required vars at runtime produce cryptic errors rather than clear startup failures.
- Why it matters: The web `env.ts` only provides defaults; there's no validation that critical vars like `NEXT_PUBLIC_API_URL` are actually populated.
- User / business impact: Hard-to-diagnose failures if env vars are missing.
- Recommended fix: Add a basic validation at web app startup using a Zod schema. Create `apps/web/lib/env.ts`:
  ```typescript
  import { z } from "zod";
  const envSchema = z.object({
    NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_GA_ID: z.string().optional(),
    NEXT_PUBLIC_TAWKTO_ID: z.string().optional(),
  });
  // Validate at module load time
  envSchema.parse(process.env);
  ```
- Suggested validation: Web app fails to start if `NEXT_PUBLIC_API_URL` is not a valid URL.
- Owner suggestion: Frontend team
- Effort estimate: 1 hour
- Status: Open

### Finding ID: SECRET-P2-004 - 3 webhook secrets not listed in rotation documentation

- Severity: P2 - Medium
- Confidence: High
- Area: Documentation
- Evidence:
  - `apps/api/src/config/env.ts:29-31`: `JIRA_WEBHOOK_SECRET`, `JSM_WEBHOOK_SECRET`, `M365_WEBHOOK_SECRET`
  - `docs/SECRETS_ROTATION.md` — No entries for these 3 secrets
- What is happening: Three webhook secrets that exist in the API env schema are not in the secrets rotation inventory or documentation.
- Why it matters: These secrets are used for HMAC verification of incoming webhooks. If not rotated, a leaked webhook secret could allow attackers to forge webhook payloads.
- User / business impact: Risk of forged webhook data (fake Jira updates, fake Stripe events, etc.).
- Recommended fix: Add to SECRETS_ROTATION.md inventory table with 90-day rotation frequency.
- Suggested validation: Cross-reference api/src/config/env.ts with SECRETS_ROTATION.md.
- Owner suggestion: Platform team
- Effort estimate: 30 minutes
- Status: Open

### Finding ID: SECRET-P3-001 - No automated secret rotation reminder workflow

- Severity: P3 - Low (documented, needs automation)
- Confidence: High
- Area: Automation
- Evidence:
  - `docs/SECRETS_ROTATION.md lines 168-191`: Full YAML example for a reminder workflow
  - No `.github/workflows/secret-rotation-reminder.yml` file exists
- What is happening: The rotation policy document contains a YAML example for a quarterly reminder workflow, but the actual workflow has not been created.
- Why it matters: Creates a quarterly GitHub Issue reminding the team to rotate secrets. Without it, rotation is manual and will likely be skipped.
- Recommended fix: Copy the YAML from SECRETS_ROTATION.md into `.github/workflows/secret-rotation-reminder.yml`.
- Suggested validation: Workflow triggers on schedule and creates an issue.
- Owner suggestion: Platform team
- Effort estimate: 30 minutes
- Status: Open

## Risks

| Risk | Severity | Likelihood | Impact | Evidence | Mitigation |
|------|----------|------------|--------|----------|------------|
| Undocumented env vars | P2 | Certain | Low (confusion) | 5 vars missing from docs | Add to ENVIRONMENT_VARIABLES.md |
| No rotation automation | P2 | Medium | Medium | No reminder workflow | Create workflow |
| Web runtime validation missing | P2 | Low | Low (Next.js validates) | No Zod in web | Add env validation |
| Undocumented webhook secrets | P2 | Medium | Medium (can't rotate) | 3 secrets missing from rotation doc | Add to SECRETS_ROTATION.md |
| Secrets on disk plaintext | P2 | Low | High (droplet compromise) | .env file with chmod 600 | Evaluate secrets manager |

## Secret Classification Matrix

### Critical (P0) — Immediate rotation on compromise

| Secret | Service | Rotates | In Rotation Doc? |
|--------|---------|---------|:----------------:|
| JWT_SECRET | API | 90 days | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | API, Worker | 90 days | ✅ |
| CI_SSH_PRIVATE_KEY | Deploy | 90 days | ✅ |

### High — Requires rotation

| Secret | Service | Rotates | In Rotation Doc? |
|--------|---------|---------|:----------------:|
| SUPABASE_ANON_KEY | API, Worker | 90 days | ✅ |
| STRIPE_SECRET_KEY | API | 90 days | ✅ |
| STRIPE_WEBHOOK_SECRET | API | 90 days | ✅ |
| SUPABASE_ACCESS_TOKEN | Migrations | 90 days | ✅ |
| JIRA_API_TOKEN | Worker | 90 days | ✅ |
| JSM_API_TOKEN | API | 90 days | ✅ |
| JIRA_WEBHOOK_SECRET | API | — | ❌ |
| JSM_WEBHOOK_SECRET | API | — | ❌ |
| M365_WEBHOOK_SECRET | API | — | ❌ |

### Medium — Infrastructure, rotates less frequently

| Secret | Service | Rotates | In Rotation Doc? |
|--------|---------|---------|:----------------:|
| SMTP_PASS | API, Worker | 180 days | ✅ |
| M365_CLIENT_SECRET | Worker | 180 days | ✅ |
| DO_API_TOKEN | Terraform | 180 days | ✅ |
| CLOUDFLARE_API_TOKEN | Terraform | 180 days | ✅ |
| CF_ORIGIN_CERT/KEY | Deploy | 180 days | ✅ |
| DO_SPACES keys | Terraform | 180 days | ✅ |

## Recommendations

### Immediate / Release Blocking

1. Add 5 missing env vars to ENVIRONMENT_VARIABLES.md (SECRET-P2-001)
2. Create secret rotation reminder workflow (SECRET-P3-001)

### This Week

3. Add 3 webhook secrets to SECRETS_ROTATION.md (SECRET-P2-004)
4. Add basic runtime env validation to web app (SECRET-P2-003)

### This Month

5. Evaluate secrets manager to replace disk-based .env file
6. Add automated rotation enforcement for CI_SSH_PRIVATE_KEY

### Later / Platform Evolution

7. Implement secret scanning in CI (e.g., GitHub secret scanning or truffleHog)
8. Automate key rotation via API for Supabase/Stripe

## Quick Wins

| Quick win | Why it helps | Files likely involved | Validation |
|-----------|-------------|----------------------|------------|
| Add missing vars to ENVIRONMENT_VARIABLES.md | Completeness | `docs/ENVIRONMENT_VARIABLES.md` | Cross-reference with env.ts |
| Create rotation reminder workflow | Automation | `.github/workflows/secret-rotation-reminder.yml` | Manual trigger creates issue |
| Add webhook secrets to rotation doc | Completeness | `docs/SECRETS_ROTATION.md` | Document review |

## Hardening Backlog

| Backlog item | Priority | Owner suggestion | Effort | Dependency |
|-------------|----------|-----------------|--------|------------|
| Missing env vars in doc | P2 | Platform | 30 min | None |
| Rotation reminder workflow | P2 | Platform | 30 min | None |
| Web env validation | P2 | Frontend | 1 hour | None |
| Webhook secrets in doc | P2 | Platform | 30 min | None |
| Secrets manager eval | P2 | Infrastructure | 8 hours | None |

## Suggested Tests

- CI workflow that validates ENVIRONMENT_VARIABLES.md covers all vars in env.ts schemas
- Test web app fails with clear error if NEXT_PUBLIC_API_URL is missing
- Test rotation reminder workflow creates issue

## Suggested Documentation Updates

- Add missing API_PORT, TURNSTILE_SECRET_KEY, JIRA_WEBHOOK_SECRET, JSM_WEBHOOK_SECRET, M365_WEBHOOK_SECRET to ENVIRONMENT_VARIABLES.md
- Add webhook secrets to SECRETS_ROTATION.md inventory and procedures
- Create separate `docs/BREAK_GLASS_RUNBOOK.md` for emergency access procedures

## Open Questions

| Question | Why it matters | Evidence needed |
|----------|---------------|----------------|
| Are there any plaintext secrets committed in any past commit? | Historical exposure risk | GitLeaks scan of entire history |
| Who has access to GitHub Environments and Secrets? | Access control review | GitHub org settings |
| Is the CI_SSH_PRIVATE_KEY scoped to specific environments? | Scope of SSH credential | GitHub Environment settings |

## Appendix

### Environment Variable Cross-Reference

| Var | API env.ts | Worker env.ts | Web .env.example | ENV_VARS.md | SECRETS_ROTATION.md |
|-----|:----------:|:-------------:|:----------------:|:-----------:|:-------------------:|
| NODE_ENV | ✅ | ✅ | ❌ | ✅ | ❌ |
| API_PORT | ✅ | ❌ | ❌ | ❌ | ❌ |
| SUPABASE_URL | ✅ | ✅ | ❌ | ✅ | ✅ |
| SUPABASE_ANON_KEY | ✅ | ✅ | ❌ | ✅ | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | ✅ | ❌ | ✅ | ✅ |
| JWT_SECRET | ✅ | ❌ | ❌ | ✅ | ✅ |
| CORS_ORIGIN | ✅ | ❌ | ❌ | ✅ | ❌ |
| STRIPE_SECRET_KEY | ✅ | ✅ | ❌ | ✅ | ✅ |
| STRIPE_WEBHOOK_SECRET | ✅ | ❌ | ❌ | ✅ | ✅ |
| JIRA_WEBHOOK_SECRET | ✅ | ❌ | ❌ | ❌ | ❌ |
| JSM_WEBHOOK_SECRET | ✅ | ❌ | ❌ | ❌ | ❌ |
| M365_WEBHOOK_SECRET | ✅ | ❌ | ❌ | ❌ | ❌ |
| TURNSTILE_SECRET_KEY | ✅ | ❌ | ❌ | ❌ | ❌ |
| NEXT_PUBLIC_API_URL | ❌ | ❌ | ✅ | ✅ | ❌ |
| NEXT_PUBLIC_SENTRY_DSN | ❌ | ❌ | ✅ | ✅ | ❌ |
| SENTRY_DSN | ✅ | ✅ | ❌ | ✅ | ✅ |
