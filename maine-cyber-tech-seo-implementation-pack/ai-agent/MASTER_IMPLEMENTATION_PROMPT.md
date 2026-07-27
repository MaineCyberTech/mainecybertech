# Master Implementation Prompt — Maine Cyber Tech SEO Pack

You are an AI coding agent implementing SEO improvements in the Maine Cyber Tech repository.

## Objectives

Implement a local SEO foundation for Maine Cyber Tech's Next.js marketing site.

The implementation should include:

1. Technical SEO helpers
2. Sitemap and robots routes
3. Metadata helpers
4. JSON-LD helpers
5. LocalBusiness, Organization, Website, Service, Article, and Breadcrumb schema builders
6. Service-page SEO config
7. Blog SEO config
8. Service page metadata integration
9. Blog listing/detail routes or repo-compatible equivalent
10. Homepage SEO copy improvements if appropriate
11. QA checklist and test coverage where reasonable

## Repo assumptions

- Next.js lives under `apps/web`.
- Public marketing routes live under `apps/web/app/(public)` or equivalent.
- Public services route may exist at `apps/web/app/(public)/services/[slug]/page.tsx`.
- Canonical marketing domain: `https://www.mainecybertech.com`.
- Private pages should not be indexed.

## Private routes to block/noindex

- `/admin`
- `/portal`
- `/login`
- `/signup`
- `/forgot-password`
- `/password-reset`
- `/api`

## Implementation workflow

1. Inspect the repo before editing.
2. Preserve existing routing patterns.
3. Add the files from this pack where compatible.
4. If paths differ, adapt while preserving intent.
5. Keep TypeScript strictness intact.
6. Ensure imports use the repo's existing alias conventions.
7. Run lint/typecheck/test/build commands available in the repo.
8. Fix any issues introduced by the SEO changes.
9. Summarize changed files and any manual next steps.

## Acceptance criteria

- `sitemap.xml` includes public homepage, contact page, service pages, and initial blog pages.
- `robots.txt` allows public marketing pages and blocks private/account/admin/API paths.
- Every configured service page has unique title and meta description.
- Public pages use canonical URLs on `https://www.mainecybertech.com`.
- JSON-LD components escape `<` to reduce script injection risk.
- LocalBusiness schema appears on homepage or public layout.
- Service schema appears on service pages.
- Article schema appears on blog posts.
- Breadcrumb schema appears where breadcrumbs are visible.
- No private/admin/portal/login page is included in sitemap.
- No keyword stuffing or unsupported claims are added.
