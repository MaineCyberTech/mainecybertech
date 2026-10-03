# Admin Utilities

**Category:** Administration
**API Routes:** `apps/api/src/routes/admin.ts`

## Overview

Administrative utility endpoints providing operational tools for platform administrators. Currently supports SMTP configuration verification via test email delivery.

## Key Features

- Test email delivery to verify SMTP configuration
- Returns success/failure status with error details
- Useful for diagnosing notification delivery issues

## Endpoints

| Method | Path                     | Description                           |
| ------ | ------------------------ | ------------------------------------- |
| POST   | /api/v1/admin/test-email | Send test email to verify SMTP config |

## Data Model

N/A — operational utility, no database interaction.

## Access Control

- Admin: can send test emails
- Client: no access
