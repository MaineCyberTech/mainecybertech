# Domain Monitors

**Category:** Operations
**API Routes:** `apps/api/src/routes/domain-monitors.ts`
**SDK:** `packages/sdk/src/domain-monitors.ts`

## Overview
DNS/domain/SSL health monitoring for tracking domain registration, SSL certificate expiry, email security records (SPF/DKIM/DMARC), and DNS configuration status.

## Key Features
- Domain registration and expiry tracking
- SSL certificate validity and expiration monitoring
- Email security posture (SPF, DKIM, DMARC status)
- Nameserver mismatch detection
- Cloudflare proxy status verification
- Recent scheduled check results per domain
- Stats dashboard (SSL invalid, expiring, SPF/DKIM/DMARC status)
- CSV/JSON export

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/domain-monitors | List all domain monitors (paginated, filterable by status/SSL expiry) |
| GET | /api/v1/domain-monitors/export | Export domain monitors as CSV/JSON |
| GET | /api/v1/domain-monitors/stats | Get aggregate domain health statistics |
| GET | /api/v1/domain-monitors/:id | Get monitor by ID (with recent check results) |
| POST | /api/v1/domain-monitors | Add a domain monitor |
| PATCH | /api/v1/domain-monitors/:id | Update monitor (optimistic locking) |
| DELETE | /api/v1/domain-monitors/:id | Remove a domain monitor |

## Data Model
Key fields: `domain`, `display_name`, `ssl_expires`, `ssl_valid`, `spf_status`, `dkim_status`, `dmarc_status`, `dns_provider`, `nameserver_mismatch`, `cloudflare_proxied`, `last_checked_at`, `organization_id`, `created_by`

## Access Control
- Admin: full CRUD
- Client: read-only (portal, own org domains)

## Worker Tasks
- `domain-monitor-check`: Periodic DNS/SSL/DMARC health scan
