# Endpoint Security Coverage Map

**Category:** Security
**API Routes:** `apps/api/src/routes/endpoint-security.ts`
**SDK:** `packages/sdk/src/endpoint-security.ts`

## Overview

Unified endpoint security coverage dashboard that aggregates status from multiple EDR/XDR/MDM solutions (Microsoft Defender, SentinelOne, CrowdStrike, Sophos, Bitdefender, JAMF, Intune). Displays coverage gaps, outdated agents, policy compliance, detection counts, and a unified health score per device and per org.

## Key Features

- Multi-vendor aggregation — normalize status data from various endpoint protection platforms via connector API
- Coverage map — per-device view showing which security layers are active (AV, EDR, firewall, disk encryption, patch management, MDM enrollment)
- Gap analysis — devices missing critical protection layers flagged with severity
- Agent health — last check-in, agent version, definition freshness, scan status per device
- Detection feed — recent alerts per device with severity, type, status, and response action
- Unified health score — 0-100 score per endpoint based on active layers, recency, and alert severity
- Coverage trend — week-over-week and month-over-month coverage percentage changes

## Endpoints

| Method | Path                                  | Description                                                                    |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------ |
| GET    | /api/v1/endpoint-security/devices     | List devices with coverage status (paginated, filterable by org/vendor/health) |
| GET    | /api/v1/endpoint-security/devices/:id | Device detail with full layer status                                           |
| GET    | /api/v1/endpoint-security/dashboard   | Org-level coverage summary and trends                                          |
| GET    | /api/v1/endpoint-security/gaps        | Uncovered/gap devices for remediation                                          |
| GET    | /api/v1/endpoint-security/alerts      | Recent detection feed (filterable by severity/status)                          |
| GET    | /api/v1/endpoint-security/export      | Export device coverage report as CSV                                           |

## Data Model

`endpoint_devices` (organization_id, device_name, device_type, os, os_version, vendor, agent_version, last_checkin_at, health_score, is_active, created_at). `endpoint_layers` (device_id, layer_key (av/edr/firewall/encryption/patch/mdm), is_active, status, last_scan_at, definition_version, vendor_specific JSON). `endpoint_alerts` (device_id, alert_type, severity (low/medium/high/critical), status (new/investigation/resolved/false-positive), description, detected_at, resolved_at).

## Access Control

- Admin: full dashboard, device detail, gap list, alert management
- Client: view org coverage dashboard and device list for their org
- requireOrgAccess enforced; RLS via organization_id
- Audit logging on alert status changes and device deactivation
