# Product Comparison Pages

## Purpose

Generate structured comparison pages for common product and package decisions.

## Data file

`data/comparison-pages.json`

## Admin surface

Recommended admin route: `/admin/store/comparisons`

## Public/client surface

Recommended public or portal route: `/store/compare/[slug]`

## Implementation notes

- Match the current Maine Cyber Tech public/admin UI style.
- Keep mobile layouts clean and touch-friendly.
- Add validation and audit prompts before launch.
- Avoid collecting secrets or exposing internal operational content publicly.

## Suggested primary button

**Compare Services**
