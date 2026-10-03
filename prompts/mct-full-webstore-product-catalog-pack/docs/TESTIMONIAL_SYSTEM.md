# Review/Testimonial Placement System

## Purpose

Admin-approved testimonials with permission and provenance tracking.

## Data file

`data/testimonial-system.json`

## Admin surface

Recommended admin route: `/admin/store/testimonials`

## Public/client surface

Recommended public or portal route: `/store/[slug]`

## Implementation notes

- Match the current Maine Cyber Tech public/admin UI style.
- Keep mobile layouts clean and touch-friendly.
- Add validation and audit prompts before launch.
- Avoid collecting secrets or exposing internal operational content publicly.

## Suggested primary button

**Approve Testimonial**
