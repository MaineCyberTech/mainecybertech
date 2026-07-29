# FAQ and Objection Handling System

## Purpose

Reusable product/category FAQs with FAQ schema readiness.

## Data file

`data/faq-system.json`

## Admin surface

Recommended admin route: `/admin/store/faqs`

## Public/client surface

Recommended public or portal route: `/store/[slug]`

## Implementation notes

- Match the current Maine Cyber Tech public/admin UI style.
- Keep mobile layouts clean and touch-friendly.
- Add validation and audit prompts before launch.
- Avoid collecting secrets or exposing internal operational content publicly.

## Suggested primary button

**Manage FAQs**
