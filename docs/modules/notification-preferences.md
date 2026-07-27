# Notification Preferences

**Category:** Core
**API Routes:** `apps/api/src/routes/notification-preferences.ts`

## Overview

Per-user notification preference management allowing users to toggle notification delivery across email, SMS, and in-app channels for each functional module (tickets, projects, documents, billing, system).

## Key Features

- Per-module toggles (tickets, projects, documents, billing, system)
- Per-channel toggles (email, SMS, in-app)
- Upsert semantics (creates on first PUT, updates on subsequent)
- Organization-scoped preference queries
- Returns available modules and channels alongside preferences

## Endpoints

| Method | Path                             | Description                                                     |
| ------ | -------------------------------- | --------------------------------------------------------------- |
| GET    | /api/v1/notification-preferences | Get preferences (filterable by org, returns modules + channels) |
| PUT    | /api/v1/notification-preferences | Upsert preferences (per-module per-channel toggles)             |

## Data Model

Key fields: `user_id`, `module`, `channel`, `enabled`, `organization_id`

## Access Control

- Authenticated: can read and update own preferences
- Admin: no additional privileges on this endpoint
