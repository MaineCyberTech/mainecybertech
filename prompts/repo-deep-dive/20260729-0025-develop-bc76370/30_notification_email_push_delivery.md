# Notification, Email, and Push Delivery Audit (Re-Run)

**Run ID:** 20260729-0025-develop-bc76370
**Previous Run:** 20260728-0142-develop-21a10d6
**Finding Area Code:** NOTIF
**Status:** RE-RUN VERIFICATION

## Executive Summary

**Risk Score: 20/100 (Low).** Improvements: SSE endpoint now has keepalive and proper cleanup; notification preference optimistic update now reverts on error; worker email module now uses validated env object. 2 of 5 findings resolved. 3 remain open.

## Previous Findings Status

### NOTIF-P1-001: SSE Endpoint Exists But Client Uses Polling

**Status:** PARTIALLY RESOLVED
**Previous Evidence:** API has /api/v1/notifications/stream SSE endpoint. Client NotificationBell.tsx uses 30s polling.
**Current Evidence:** pps/api/src/routes/notifications.ts:31-34 — SSE endpoint now has 30s keepalive interval + clearInterval(keepaliveInterval) on close (lines 31-34, 84). Supabase Realtime subscription properly wired. Client NotificationBell.tsx still uses 30s polling fallback.
**Recommendation:** Wire SSE endpoint into NotificationBell component.

### NOTIF-P1-002: Notification Preferences Optimistic Update Not Reverted on Error

**Status:** RESOLVED
**Previous Evidence:** NotificationBell.tsx:159-168 — toggle updates UI optimistically, error silently ignored.
**Current Evidence:** pps/web/components/NotificationBell.tsx:162-171 — Now reverts optimistic update on failure: setPrefs((prev) => ({ ...prev, [moduleKey]: !enabled })) in catch block with console.warn.
**Fix verified:** bc76370 commit.

### NOTIF-P2-001: No Email Notification Dedup in Worker

**Status:** STILL OPEN
**Previous Evidence:** Worker scheduled-notifications.ts doesn't check if email was already sent.
**Current Evidence:** No changes to dedup logic.
**Recommendation:** Add idempotency check using notification ID in email metadata.

### NOTIF-P2-002: No Push Notification Support

**Status:** STILL OPEN
**Previous Evidence:** No push notification service integrated.
**Current Evidence:** No push notifications added.
**Recommendation:** Consider adding push notifications for mobile users.

### NOTIF-P3-001: No "Quiet Hours" Setting

**Status:** STILL OPEN
**Previous Evidence:** Notification preferences support per-module toggles but no quiet hours.
**Current Evidence:** No quiet hours added.
**Recommendation:** Add quiet hours configuration to notification preferences.

## New Findings

### NOTIF-NEW-001: Worker Email Module Now Uses Validated Env

**Status:** RESOLVED
**Evidence:** pps/worker/src/email.ts:2 — Now imports { env } from "./env" instead of reading process.env directly. SMTP vars validated through Zod schema.
**Fix verified:** dfb5ef8 commit.

### NOTIF-NEW-002: Worker Logger Has PII Redaction

**Status:** RESOLVED
**Evidence:** pps/worker/src/logger.ts:7-25 — Added PII redaction paths: email, phone, ullName, ull_name, _.email, _.phone.
**Fix verified:** dfb5ef8 commit.

## Summary

| Finding                                                      | Severity | Previous | Current            |
| ------------------------------------------------------------ | -------- | -------- | ------------------ |
| NOTIF-P1-001: SSE endpoint exists but client uses polling    | P1       | OPEN     | PARTIALLY RESOLVED |
| NOTIF-P1-002: Notification preferences not reverted on error | P1       | OPEN     | RESOLVED           |
| NOTIF-P2-001: No email notification dedup                    | P2       | OPEN     | STILL OPEN         |
| NOTIF-P2-002: No push notification support                   | P2       | OPEN     | STILL OPEN         |
| NOTIF-P3-001: No quiet hours setting                         | P3       | OPEN     | STILL OPEN         |
| NOTIF-NEW-001: Worker email uses validated env               | —        | —        | RESOLVED           |
| NOTIF-NEW-002: Worker logger has PII redaction               | —        | —        | RESOLVED           |
