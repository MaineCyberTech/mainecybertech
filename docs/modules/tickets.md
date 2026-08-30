# Tickets

**Category:** Core
**API Routes:** `apps/api/src/routes/tickets.ts`
**SDK:** `packages/sdk/src/tickets.ts`

## Overview

Support ticket system with full CRUD, comment threads with a 5-minute edit window, bulk status/priority updates, and CSV/JSON export. Includes assignment notifications, optimistic locking, and markdown comment rendering.

## Key Features

- Full CRUD with optimistic locking on updates
- Comment system with 5-minute edit window and `edited_at` tracking
- Bulk status/priority update endpoint
- Assignment notifications (email + in-app)
- CSV/JSON export of ticket lists
- Markdown rendering in comments
- Filterable by status, priority, assignee, and organization

## Endpoints

| Method | Path                                    | Description                                                 |
| ------ | --------------------------------------- | ----------------------------------------------------------- |
| GET    | /api/v1/tickets                         | List tickets (paginated, filterable by status/priority/org) |
| GET    | /api/v1/tickets/export                  | Export tickets as CSV/JSON                                  |
| POST   | /api/v1/tickets                         | Create a ticket                                             |
| GET    | /api/v1/tickets/:id                     | Get ticket by ID                                            |
| PATCH  | /api/v1/tickets/:id                     | Update ticket (optimistic locking)                          |
| DELETE | /api/v1/tickets/:id                     | Delete a ticket                                             |
| POST   | /api/v1/tickets/bulk                    | Bulk update status/priority                                 |
| POST   | /api/v1/tickets/:id/comments            | Add a comment                                               |
| PATCH  | /api/v1/tickets/:id/comments/:commentId | Edit a comment (5-min window)                               |

## Data Model

Key tables: `tickets` (subject, description, status, priority, assignee), `ticket_comments` (body, created_by, edited_at)

## Access Control

- Admin: full CRUD + bulk update + comment management
- Client: create + read own org tickets + comment (portal)
