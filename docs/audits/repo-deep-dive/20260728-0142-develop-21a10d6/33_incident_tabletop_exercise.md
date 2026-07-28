# Incident Response Tabletop Exercise

**Run ID:** `20260728-0142-develop-21a10d6`
**Finding Area Code:** INC

## Executive Summary

**Overall Incident Readiness Score: 5.8/10.** Strong foundations (Sentry, structured logging, circuit breakers, idempotency, audit trails, graceful shutdown). Critical gaps: no pre-commit secret scanning, no automated alerting on Supabase access, no worker health check in deploy, no CAPTCHA on public form.

**21 findings** (2 Critical, 10 High, 6 Medium, 3 Low)

## Scenario 1: Database Corruption During Migration

**Score: 5.0/10**

- **INC-001:** Supabase rollback is manual-only with no automated trigger (HIGH)
- **INC-002:** No database integrity monitoring to detect schema corruption (HIGH)

## Scenario 2: Compromised JWT Secret

**Score: 7.1/10** (Best prepared)

- **INC-005:** No alert on JWT fallback to Supabase auth (potential key compromise indicator) (HIGH)
- **INC-006:** No bulk data exfiltration detection (HIGH)

## Scenario 3: Deployment Failure with Partial Rollout

**Score: 5.8/10**

- **INC-009:** Deploy workflow does not health-check the Worker service (HIGH)
- **INC-010:** No version compatibility verification between API and Worker (HIGH)

## Scenario 4: Teams Webhook Abuse

**Score: 6.2/10**

- **INC-013:** Public contact form has no CAPTCHA or bot protection (HIGH)
- **INC-014:** Global rate limit of 300 req/15min is too generous for public form (MEDIUM)

## Scenario 5: Data Breach via Exposed Service Role Key

**Score: 5.1/10** (Worst prepared)

- **INC-017:** No pre-commit secret scanning to prevent accidental key exposure (CRITICAL)
- **INC-018:** No alerting on direct Supabase access via service role key (CRITICAL)
- **INC-020:** Service role key used for all admin operations, bypassing RLS (HIGH)

## Priority Remediation

### P0 (Immediate)

1. Add pre-commit secret scanning (talisman/git-secrets)
2. Add alerting on direct Supabase access

### P1 (Next Sprint)

3. Add Worker health check to deploy workflow
4. Add API/Worker version compatibility check
5. Add CAPTCHA to public contact form
6. Wire JWT fallback warning to alert channel
7. Add bulk data exfiltration detection
