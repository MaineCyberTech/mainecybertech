# SEO Landing Page Generator

## Purpose

Generate local and vertical service landing page scaffolds from catalog data.

## Data file

`data/seo-landing-pages.json`

## Admin surface

Recommended admin route: `/admin/store/seo-pages`

## Public/client surface

Recommended public or portal route: `/locations/[slug] or /services/[slug]`

## Implementation notes

- Match the current Maine Cyber Tech public/admin UI style.
- Keep mobile layouts clean and touch-friendly.
- Add validation and audit prompts before launch.
- Avoid collecting secrets or exposing internal operational content publicly.

## Suggested primary button

**Generate SEO Page**
