# Visual Asset Guide for Maine Cyber Tech Store

## Visual direction

Use a clean, modern, friendly technical style that feels professional but not cold. The store should feel approachable for local small businesses while still communicating cybersecurity and infrastructure competence.

## Recommended visual system

- Lucide React icons for product/category cards.
- Subtle gradient icon tiles.
- Optional abstract hero illustrations for category landing areas.
- Minimal stock photography, only where it adds local or human context.
- Avoid generic hacker imagery, dark fear-based visuals, or cluttered dashboards.

## Icon mapping

Use `data/visual-service-map.json` as the source of truth for category icons and image prompts.

## Image sourcing rules

- Prefer generated abstract illustrations or icon-based cards for consistency.
- If using stock photos from Unsplash or Pexels, keep provenance records.
- Avoid identifiable people unless model-release/provenance risk is acceptable.
- Never imply the person, brand, or trademark in a stock image endorses Maine Cyber Tech.
- Do not use vendor logos unless authorized.

## Implementation notes

- Add `visual` fields to product/category data: `icon`, `accent`, `image`, `alt`, `decorative`.
- Use `next/image` for raster images.
- Lazy-load below-the-fold visuals.
- Use SVG/icon components for cards.
- Provide alt text for meaningful images.
- Set decorative icons/images to `aria-hidden`.
