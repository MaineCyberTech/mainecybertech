# Dynamic Client Forms

**Category:** Client Experience
**API Routes:** `apps/api/src/routes/dynamic-forms.ts`
**SDK:** `packages/sdk/src/dynamic-forms.ts`

## Overview

Form builder system allowing admins to create dynamic forms that clients can submit responses to. Supports a full publish workflow, response collection, and export of submissions.

## Key Features

- Full CRUD for form definitions with JSON schema fields
- Publish/unpublish workflow (draft → published)
- Client-side submission endpoint
- Paginated submissions list with filters
- CSV/JSON export of submissions
- Per-organization form scoping

## Endpoints

| Method | Path                                  | Description                                  |
| ------ | ------------------------------------- | -------------------------------------------- |
| GET    | /api/v1/dynamic-forms                 | List forms (paginated, filterable by status) |
| POST   | /api/v1/dynamic-forms                 | Create a form                                |
| GET    | /api/v1/dynamic-forms/:id             | Get form by ID                               |
| PATCH  | /api/v1/dynamic-forms/:id             | Update form definition                       |
| DELETE | /api/v1/dynamic-forms/:id             | Delete a form                                |
| POST   | /api/v1/dynamic-forms/:id/publish     | Publish a form                               |
| POST   | /api/v1/dynamic-forms/:id/submit      | Submit a response                            |
| GET    | /api/v1/dynamic-forms/:id/submissions | List submissions                             |
| GET    | /api/v1/dynamic-forms/:id/export      | Export submissions as CSV/JSON               |

## Data Model

Key tables: `dynamic_forms` (schema + status), `dynamic_form_submissions` (response data + submitter)

## Access Control

- Admin: full CRUD + publish + view submissions + export
- Client: submit responses to published forms only
