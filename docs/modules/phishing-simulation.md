# Phishing Simulation Lite

**Category:** Security
**API Routes:** `apps/api/src/routes/phishing-simulation.ts`
**SDK:** `packages/sdk/src/phishing-simulation.ts`

## Overview

Lightweight phishing simulation platform for MSP-managed security awareness programs. Defines campaign templates, schedules simulated phishing emails, tracks user interactions (opened, clicked link, submitted credentials, reported), and generates risk scores per user and per org.

## Key Features

- Campaign template library — predefined phishing scenarios (credential harvest, malicious attachment, urgent action, fake login, gift card, voicemail)
- Campaign scheduling — one-shot or recurring (weekly/monthly/quarterly) with target user group selection
- Interaction tracking — opened, clicked, credential submitted, attachment opened, reported via Phish Alert Button
- User risk scoring — weighted score based on interactions (reporting lowers score, clicking raises it)
- Org-level dashboard — phish-prone percentage, repeat offender list, risk trend over time
- User training assignment — automatically assign security training to users who fail a campaign
- CSV export for client compliance reporting

## Endpoints

| Method | Path                                   | Description                                 |
| ------ | -------------------------------------- | ------------------------------------------- |
| GET    | /api/v1/phishing/templates             | List phishing templates                     |
| POST   | /api/v1/phishing/templates             | Create custom template                      |
| PATCH  | /api/v1/phishing/templates/:id         | Update template                             |
| DELETE | /api/v1/phishing/templates/:id         | Delete template                             |
| GET    | /api/v1/phishing/campaigns             | List campaigns (filterable by org/status)   |
| POST   | /api/v1/phishing/campaigns             | Create and launch campaign                  |
| PATCH  | /api/v1/phishing/campaigns/:id         | Update campaign                             |
| GET    | /api/v1/phishing/campaigns/:id/results | Campaign results with per-user interactions |
| GET    | /api/v1/phishing/org-risk/:orgId       | Org risk score and trend data               |
| GET    | /api/v1/phishing/export/:campaignId    | Export campaign results as CSV              |

## Data Model

`phishing_templates` (organization_id, name, scenario_type, subject, sender_name, sender_email, body_html, landing_page_url, attachment_filename, created_by, is_global boolean). `phishing_campaigns` (template_id, organization_id, name, status (draft/sending/in-progress/completed), target_count, scheduled_at, completed_at, created_by). `phishing_interactions` (campaign_id, user_id, event (opened/clicked/credentials/attachment/reported), timestamp, ip_address, user_agent).

## Access Control

- Admin: full CRUD, launch campaigns, view results, export
- Client: view campaign results and org risk score for their org only
- requireOrgAccess on all org-scoped endpoints
- Audit logging on campaign create, launch, and template changes
