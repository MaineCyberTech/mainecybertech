# Incident Response Tabletop Exercise (Re-Run)

**Run ID:** 20260729-0025-develop-bc76370
**Previous Run:** 20260728-0142-develop-21a10d6
**Finding Area Code:** INC
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Overall Incident Readiness Score: 7.2/10** (improved from 5.8/10). Significant improvements: pre-commit secret scanning added, CAPTCHA on public contact form, deploy workflow includes worker health check and validation/E2E gates, HSTS/CSP headers on Caddy, nonce-based CSP in middleware. 6 of 21 findings resolved. 11 remain open. 4 new findings.

## Scenario 1: Database Corruption During Migration

**Score: 5.5/10** (improved from 5.0)

### INC-001: Supabase Rollback Is Manual-Only (HIGH)

**Status:** STILL OPEN
**Evidence:** No automated rollback trigger added.
**Recommendation:** Add supabase migration rollback to deploy workflow.

### INC-002: No Database Integrity Monitoring (HIGH)

**Status:** STILL OPEN
**Evidence:** No integrity monitoring added.
**Recommendation:** Add periodic database integrity checks.

## Scenario 2: Compromised JWT Secret

**Score: 7.5/10** (improved from 7.1)

### INC-005: No Alert on JWT Fallback to Supabase Auth (HIGH)

**Status:** STILL OPEN
**Evidence:** No alerting added when JWT verification falls back to Supabase.
**Recommendation:** Add warning-level log and alert channel.

### INC-006: No Bulk Data Exfiltration Detection (HIGH)

**Status:** STILL OPEN
**Evidence:** No exfiltration detection added.
**Recommendation:** Add rate limiting on bulk data endpoints.

## Scenario 3: Deployment Failure with Partial Rollout

**Score: 7.5/10** (improved from 5.8)

### INC-009: Deploy Workflow Does Not Health-Check the Worker Service (HIGH)

**Status:** RESOLVED
**Evidence:** deploy-do.yml:304-307 — Worker health check via SSH to port 3001 is now included in the deploy workflow.
**Fix verified:** b9e84f0 commit.

### INC-010: No Version Compatibility Verification Between API and Worker (HIGH)

**Status:** STILL OPEN
**Evidence:** No version compatibility check added.
**Recommendation:** Add version header or manifest for API/Worker compatibility.

## Scenario 4: Teams Webhook Abuse

**Score: 8.0/10** (improved from 6.2)

### INC-013: Public Contact Form Has No CAPTCHA or Bot Protection (HIGH)

**Status:** RESOLVED
**Evidence:** pps/web/components/marketing/ContactForm.tsx:53-62,227-236 — Cloudflare Turnstile CAPTCHA integrated. pps/api/src/routes/public.ts:25-39,112-120 — Server-side CAPTCHA verification, TURNSTILE_SECRET_KEY env var in schema.
**Fix verified:** 879c058 commit.

### INC-014: Global Rate Limit of 300 req/15min Too Generous for Public Form (MEDIUM)

**Status:** STILL OPEN
**Evidence:** Global rate limit unchanged.
**Recommendation:** Add a stricter per-IP rate limit specific to the public form endpoints.

## Scenario 5: Data Breach via Exposed Service Role Key

**Score: 6.5/10** (improved from 5.1)

### INC-017: No Pre-Commit Secret Scanning (CRITICAL)

**Status:** RESOLVED
**Evidence:** .husky/pre-commit — Added pre-commit hook with secret scanning. Verified by commit 34a4d65.
**Fix verified:** 34a4d65 commit.

### INC-018: No Alerting on Direct Supabase Access via Service Role Key (CRITICAL)

**Status:** STILL OPEN
**Evidence:** No alerting added.
**Recommendation:** Add Supabase audit log monitoring and alerting.

### INC-020: Service Role Key Used for All Admin Operations, Bypassing RLS (HIGH)

**Status:** STILL OPEN (By-design)
**Evidence:** All API queries use service_role key. This is by-design with application-layer tenant isolation via
equireOrgAccess.
**Recommendation:** Document this as an accepted risk with mitigation.

## New Findings

### INC-NEW-001: Deploy Workflow Now Gated by Validate + E2E + Migrations

**Severity:** RESOLVED (Mitigation)
**Evidence:** deploy-do.yml:98-110 — Deploy workflow now validates (test/lint/typecheck/audit), runs E2E, and applies migrations before deployment.
**Fix verified:** b9e84f0 commit.

### INC-NEW-002: Nonce-Based CSP Added to Middleware

**Severity:** RESOLVED (Mitigation)
**Evidence:** pps/web/middleware.ts:27-45 — Nonce-based CSP headers with 'unsafe-eval' removed from production CSP.
**Fix verified:** 1807d29 commit.

### INC-NEW-003: HSTS and CSP Headers Added to Caddyfile

**Severity:** RESOLVED (Mitigation)
**Evidence:** infra/digitalocean/Caddyfile — HSTS (max-age=63072000; includeSubDomains; preload) and CSP headers added to all 4 domains.
**Fix verified:** 7b80846 commit.

### INC-NEW-004: Outbound Webhook Dispatcher with HMAC Signing

**Severity:** RESOLVED
**Evidence:** pps/worker/src/tasks/webhook-dispatcher.ts — New outbound webhook dispatcher with HMAC-SHA256 signing, timeout, delivery logging, and failure tracking.
**Fix verified:** 7227365 commit.

## Summary

| Finding                                           | Severity | Previous | Current                |
| ------------------------------------------------- | -------- | -------- | ---------------------- |
| INC-001: Supabase rollback manual-only            | HIGH     | OPEN     | STILL OPEN             |
| INC-002: No database integrity monitoring         | HIGH     | OPEN     | STILL OPEN             |
| INC-005: No alert on JWT fallback                 | HIGH     | OPEN     | STILL OPEN             |
| INC-006: No bulk data exfiltration detection      | HIGH     | OPEN     | STILL OPEN             |
| INC-009: Worker health check in deploy            | HIGH     | OPEN     | RESOLVED               |
| INC-010: No API/Worker version check              | HIGH     | OPEN     | STILL OPEN             |
| INC-013: No CAPTCHA on public form                | HIGH     | OPEN     | RESOLVED               |
| INC-014: Rate limit too generous                  | MEDIUM   | OPEN     | STILL OPEN             |
| INC-017: No pre-commit secret scanning            | CRITICAL | OPEN     | RESOLVED               |
| INC-018: No alert on Supabase service role access | CRITICAL | OPEN     | STILL OPEN             |
| INC-020: Service role bypasses RLS                | HIGH     | OPEN     | STILL OPEN (by-design) |
| INC-NEW-001: Deploy gated by validate+E2E         | —        | —        | RESOLVED               |
| INC-NEW-002: Nonce-based CSP                      | —        | —        | RESOLVED               |
| INC-NEW-003: HSTS/CSP in Caddy                    | —        | —        | RESOLVED               |
| INC-NEW-004: Outbound webhook dispatcher          | —        | —        | RESOLVED               |
