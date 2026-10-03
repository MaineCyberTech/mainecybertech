# Bulk Invite

**Category:** Administration
**API Routes:** `apps/api/src/routes/bulk.ts`

## Overview

Bulk user invitation system that accepts a CSV file of email addresses and creates Supabase Auth accounts with organization memberships. Handles duplicate detection and provides detailed import results.

## Key Features

- CSV parsing with email extraction
- Duplicate detection (existing users skipped)
- Supabase Auth account creation per invitee
- Automatic membership creation with specified role
- Detailed response with success/failure counts per row

## Endpoints

| Method | Path                | Description                                   |
| ------ | ------------------- | --------------------------------------------- |
| POST   | /api/v1/bulk/invite | Bulk invite users from CSV (email, role, org) |

## Data Model

Key tables: `profiles` (user accounts), `memberships` (org assignments)

## Access Control

- Admin: can bulk invite users into any organization
- Client: no access
