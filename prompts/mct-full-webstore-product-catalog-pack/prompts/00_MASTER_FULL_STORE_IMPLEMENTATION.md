# 00 Master Full Store Implementation - V2 Comprehensive

You are implementing the Maine Cyber Tech public web store and admin center using the existing portal repository and the expanded product catalog pack.

## Mission

Create a polished, engaging, informative, mobile-friendly service storefront integrated into the public area of the portal, plus a full protected admin center for managing the product catalog.

## Required public surfaces

- `/store` public catalog landing page.
- `/store/[slug]` product detail pages.
- Category navigation for all 12 categories.
- Search/filter controls.
- Product cards that match current marketing style.
- Product details with price range, summary, best-for, included items, outcomes, exclusions, prerequisites, intake fields, recommended next products, and CTA.
- Safe intake or contact handoff that never collects secrets.
- SEO metadata and structured data where appropriate.

## Required admin surfaces

- `/admin/store` catalog dashboard.
- `/admin/store/products` searchable/filterable product table.
- `/admin/store/products/[id]` product detail/editor scaffold.
- `/admin/store/categories` category manager scaffold.
- `/admin/store/bundles` bundle/recommendation manager scaffold.
- `/admin/store/import-export` JSON/CSV import-export scaffold.
- `/admin/store/audit` catalog health and release audit screen.

## Implementation sequence

1. Inspect existing public/admin UI conventions.
2. Add typed catalog data layer.
3. Add public store page.
4. Add product detail pages.
5. Add intake renderer and safe lead capture handoff.
6. Add bundle/recommendation helpers.
7. Add full admin catalog center.
8. Add SEO metadata.
9. Add tests.
10. Run audit prompts.

## Current page style alignment

Before writing code, inspect and reuse current Maine Cyber Tech patterns instead of creating a separate storefront style.

Use these repo anchors:

- `apps/web/app/(public)/layout.tsx`
- `apps/web/app/(public)/page.tsx`
- `apps/web/app/(public)/services/[slug]/page.tsx`
- `apps/web/app/(public)/contact/page.tsx`
- `apps/web/components/marketing/MarketingHeader.tsx`
- `apps/web/components/marketing/ServiceCard.tsx`
- `apps/web/components/marketing/ContactForm.tsx`
- `apps/web/app/globals.css`
- `apps/web/tailwind.config.ts`
- `apps/web/app/(admin)/admin/layout.tsx`
- `apps/web/components/admin/*`
- `packages/ui/src/components/Button.tsx`
- `packages/ui/src/components/Input.tsx`
- `packages/ui/src/tokens/*`

Match the existing typography scale, spacing rhythm, cards, rounded corners, shadows, background treatments, CTA language, nav behavior, focus states, and responsive breakpoints. If a reusable component exists, extend it rather than duplicating styles.

## Mobile-first and engagement requirements

- Build for mobile first, then scale up to tablet and desktop.
- Public store, detail pages, intake flows, admin dashboard, product tables, editors, and audit screens must work well on phones.
- Use responsive grids: 1 column on phones, 2 on tablets, 3-4 on desktop when appropriate.
- Product cards must support long names and summaries without overflow.
- Tables must collapse into cards or use accessible responsive overflow on mobile.
- Forms must have labels, help text, large touch targets, error text, success states, and safe non-secret warnings.
- Add engaging content areas: category summaries, best-for blocks, what-you-get blocks, recommended next services, compare bundles, and help-me-choose panels.
- Include empty states, loading states, error states, and no-results states.

## One required button / CTA

Add exactly one clear primary button/CTA for this prompt's main implementation surface.

Suggested button label: **Browse Services**

Button rules:

- Use the current project Button component/style if available.
- Must be keyboard accessible and testable by role/name.
- Must have clear copy and a clear action/destination.
- Must not request or submit passwords, API keys, MFA codes, private keys, seed phrases, recovery codes, payment card data, or regulated records.
- If async, include loading/disabled behavior.

## Verification requirements

- Run catalog validation.
- Verify all 12 categories are represented.
- Verify product slugs are unique and routable.
- Verify public pages do not expose internal fulfillment procedures.
- Verify admin routes are permission-protected.
- Verify mobile layouts at 375px, 768px, 1024px, and desktop widths.
- Verify accessible headings, links, forms, labels, and button names.
- Verify `pnpm lint`, `pnpm typecheck`, tests, and relevant Playwright checks, or document exact failures and fixes.
