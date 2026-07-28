# Notification, Email, and Push Delivery Audit

## Audit Metadata

- **Run ID:** `20260728-0142-develop-21a10d6`
- **Finding Area Code:** NOTIF

## Executive Summary

In-app notification system with SSE streaming, 30s polling fallback, granular preferences, and audio chime. Email delivery via Nodemailer (worker). No push notifications. Key gaps: SSE not wired in client, notification preferences silently swallow errors, no notification dedup in worker.

## Key Findings

### NOTIF-P1-001: SSE Endpoint Exists But Client Uses Polling

**Evidence:** API has `/api/v1/notifications/stream` SSE endpoint configured in Caddy with `flush_interval -1`. Client `NotificationBell.tsx` uses 30s `setInterval` polling.
**Recommendation:** Wire SSE endpoint into `NotificationBell` component.

### NOTIF-P1-002: Notification Preferences Optimistic Update Not Reverted on Error

**Evidence:** `NotificationBell.tsx:159-168` — toggle updates UI optimistically, but error in catch block is silently ignored, never reverting the UI.
**Recommendation:** Revert optimistic update on API failure. Show success toast.

### NOTIF-P2-001: No Email Notification Dedup in Worker

**Evidence:** Worker `scheduled-notifications.ts` doesn't check if email was already sent for the same notification.
**Recommendation:** Add idempotency check using notification ID in email metadata.

### NOTIF-P2-002: No Push Notification Support

**Evidence:** No push notification service (Firebase, OneSignal, etc.) integrated.
**Recommendation:** Consider adding push notifications for mobile users.

### NOTIF-P3-001: No "Quiet Hours" Setting

**Evidence:** Notification preferences support per-module toggles but no time-based scheduling.
**Recommendation:** Add quiet hours configuration to notification preferences.

## Quick Wins

1. Wire SSE endpoint into client — 2 hours
2. Fix optimistic update revert — 30 min
3. Add notification dedup in worker email — 1 hour
