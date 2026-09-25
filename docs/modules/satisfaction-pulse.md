# Satisfaction Pulse

**Category:** Client Experience
**API Routes:** `apps/api/src/routes/satisfaction-pulses.ts`
**SDK:** `packages/sdk/src/satisfaction-pulses.ts`

## Overview

Client satisfaction survey system supporting pulse creation, template management, scheduled delivery, and response collection. Includes export for analysis and reporting.

## Key Features

- Full CRUD for satisfaction pulses
- Template library for reusable survey designs
- Scheduled pulse delivery
- Client response submission
- CSV/JSON export of responses
- Score aggregation and reporting

## Endpoints

| Method | Path                                    | Description                         |
| ------ | --------------------------------------- | ----------------------------------- |
| GET    | /api/v1/satisfaction-pulses             | List pulses (paginated, filterable) |
| POST   | /api/v1/satisfaction-pulses             | Create a pulse                      |
| GET    | /api/v1/satisfaction-pulses/:id         | Get pulse by ID                     |
| PATCH  | /api/v1/satisfaction-pulses/:id         | Update a pulse                      |
| DELETE | /api/v1/satisfaction-pulses/:id         | Delete a pulse                      |
| POST   | /api/v1/satisfaction-pulses/:id/respond | Submit a response                   |
| GET    | /api/v1/satisfaction-pulses/export      | Export responses as CSV/JSON        |
| GET    | /api/v1/satisfaction-pulses/templates   | List pulse templates                |
| POST   | /api/v1/satisfaction-pulses/templates   | Create a template                   |
| GET    | /api/v1/satisfaction-pulses/schedules   | List schedules                      |
| POST   | /api/v1/satisfaction-pulses/schedules   | Create a schedule                   |

## Data Model

Key tables: `satisfaction_pulses` (survey definitions), `satisfaction_pulse_templates` (reusable designs), `satisfaction_pulse_schedules` (delivery timing)

## Access Control

- Admin: full CRUD + templates + schedules + export
- Client: respond to pulses sent to their org
