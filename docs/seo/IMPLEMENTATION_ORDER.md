# Recommended Implementation Order

1. Add SEO config files:
   - `apps/web/lib/seo/site.ts`
   - `apps/web/lib/seo/metadata.ts`
   - `apps/web/lib/seo/schema.ts`
2. Add JSON-LD components:
   - `JsonLd.tsx`
   - `LocalBusinessJsonLd.tsx`
   - `BreadcrumbJsonLd.tsx`
3. Add `sitemap.ts` and `robots.ts`.
4. Add `services.ts` service SEO config.
5. Update public layout/homepage metadata.
6. Update service pages with `generateMetadata`, `Service` JSON-LD, and breadcrumb JSON-LD.
7. Add blog metadata config and blog routes.
8. Add initial P0 blog stubs.
9. Add homepage SEO copy refinements.
10. Run lint, typecheck, tests, and build.
11. Review sitemap output manually.
12. Validate structured data using a structured data validator before production release.
