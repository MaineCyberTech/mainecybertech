# Customer Portal Service Hub

## Purpose

Expose requested services, quote status, proposals, projects, docs, tasks, and recommended next services in portal.

## Data file

`data/portal-service-hub.json`

## Admin surface

Recommended admin route: `/admin/store/portal-services`

## Public/client surface

Recommended public or portal route: `/portal/services`

## Implementation notes

- Match the current Maine Cyber Tech public/admin UI style.
- Keep mobile layouts clean and touch-friendly.
- Add validation and audit prompts before launch.
- Avoid collecting secrets or exposing internal operational content publicly.

## Suggested primary button

**View Services**
