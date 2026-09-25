# Recommendation Engine V2

## Purpose

Advanced recommendation groups such as frequently paired, next step, upgrade path, monthly match, dependency, and seasonal match.

## Data file

`data/recommendation-engine-v2.json`

## Admin surface

Recommended admin route: `/admin/store/recommendations`

## Public/client surface

Recommended public or portal route: `/store/[slug]`

## Implementation notes

- Match the current Maine Cyber Tech public/admin UI style.
- Keep mobile layouts clean and touch-friendly.
- Add validation and audit prompts before launch.
- Avoid collecting secrets or exposing internal operational content publicly.

## Suggested primary button

**Review Recommendations**
