# Maine Cyber Tech Full Web Store Product Catalog Pack

This is the expanded repo-ready version of the Maine Cyber Tech productized service catalog. It includes all originally discussed service ideas across the 12 public web store categories, plus detailed intake questions, marketing copy, internal fulfillment procedures, bundle logic, CSV/XLSX exports, JSON schemas, and implementation prompts.

## Integration target

Use this in the MaineCyberTech/mainecybertech portal repository. The detected repo structure includes `apps/web/app/(public)` for public Next.js pages, existing marketing routes, and `apps/web/lib` for app code. This pack includes example `repo_patch` files for `/store` and `/store/[slug]`.

## Important security rule

Do not expose `ops/FULL_FULFILLMENT_PLAYBOOK.md` publicly. It is internal operations content.

## Recommended AI agent flow

1. Read `prompts/00_MASTER_FULL_STORE_IMPLEMENTATION.md`.
2. Ingest `data/products.json`, `data/categories.json`, and `data/bundle-rules.json`.
3. Implement typed catalog loading under `apps/web/lib/catalog`.
4. Implement public `/store` and `/store/[slug]` pages.
5. Add non-secret intake/lead capture.
6. Add SEO metadata and structured data.
7. Add unit/e2e tests.
8. Run lint, typecheck, tests, and manual QA.
