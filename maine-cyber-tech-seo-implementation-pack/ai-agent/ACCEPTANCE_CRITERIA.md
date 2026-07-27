# Acceptance Criteria

## Technical SEO

- [ ] `apps/web/app/sitemap.ts` exists or equivalent implementation is present.
- [ ] `apps/web/app/robots.ts` exists or equivalent implementation is present.
- [ ] Sitemap includes public canonical URLs only.
- [ ] Robots blocks private/account/admin/API areas.
- [ ] Canonical domain is `https://www.mainecybertech.com`.

## Metadata

- [ ] Site-level metadata exists.
- [ ] Service pages have unique title and description.
- [ ] Blog posts have unique title and description.
- [ ] Canonical URLs are configured.
- [ ] Open Graph metadata is configured.

## Structured Data

- [ ] LocalBusiness schema present on homepage or public layout.
- [ ] Organization schema helper exists.
- [ ] Website schema helper exists.
- [ ] Service schema helper exists and is used on service pages.
- [ ] Article schema helper exists and is used on blog posts.
- [ ] Breadcrumb schema helper exists and is used where appropriate.
- [ ] JSON-LD output escapes `<` characters.

## Page Quality

- [ ] One H1 per public page.
- [ ] Logical H2/H3 structure.
- [ ] Clear CTA to `/contact`.
- [ ] Internal links between homepage, services, blog, and contact.
- [ ] Private routes are not linked as SEO destinations.

## Content Quality

- [ ] Copy is practical and local.
- [ ] Copy avoids unsupported guarantees.
- [ ] Copy avoids keyword stuffing.
- [ ] Blog posts include FAQ sections.
- [ ] Blog posts include suggested image alt text if image components exist.

## Build Quality

- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Tests pass or existing unrelated failures are documented.
- [ ] Production build passes.
