# Case Study Generator

## Purpose

Turn completed work into publishable case study drafts with approval controls.

## Data file

`data/case-study-generator.json`

## Admin surface

Recommended admin route: `/admin/store/case-studies`

## Public/client surface

Recommended public or portal route: `/case-studies/[slug]`

## Implementation notes

- Match the current Maine Cyber Tech public/admin UI style.
- Keep mobile layouts clean and touch-friendly.
- Add validation and audit prompts before launch.
- Avoid collecting secrets or exposing internal operational content publicly.

## Suggested primary button

**Generate Case Study**
