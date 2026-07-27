# Maine Cyber Tech SEO Implementation Pack

This pack is designed to be handed to an AI coding agent working inside the Maine Cyber Tech repo.
It contains local SEO strategy, blog content ideas, metadata configs, sitemap/robots examples, JSON-LD/schema helpers, service-page SEO config, blog config, implementation prompts, and PR QA checklists.

## Intended repo assumptions

- Next.js app lives under `apps/web`.
- Public marketing routes are under `apps/web/app/(public)`.
- Dynamic service route exists at `apps/web/app/(public)/services/[slug]/page.tsx`.
- Canonical marketing domain is `https://www.mainecybertech.com`.
- Private app/admin/portal/account routes should not be indexed.

## What this pack includes

```text
docs/seo/
  README.md
  LOCAL_SEO_CONTENT_PLAN.md
  BLOG_IDEA_BACKLOG.md
  SERVICE_PAGE_KEYWORD_MAP.md
  SEO_IMPLEMENTATION_PROMPT_PACK.md
  AI_BLOG_GENERATION_PROMPTS.md
  GOOGLE_BUSINESS_PROFILE_CHECKLIST.md
  LOCAL_CITATION_CHECKLIST.md
  SEO_PR_CHECKLIST.md
  IMPLEMENTATION_ORDER.md

apps/web/app/
  sitemap.ts
  robots.ts

apps/web/lib/seo/
  site.ts
  services.ts
  blog.ts
  metadata.ts
  schema.ts

apps/web/components/seo/
  JsonLd.tsx
  LocalBusinessJsonLd.tsx
  BreadcrumbJsonLd.tsx

ai-agent/
  MASTER_IMPLEMENTATION_PROMPT.md
  SERVICE_PAGE_IMPLEMENTATION_PROMPT.md
  BLOG_SYSTEM_IMPLEMENTATION_PROMPT.md
  HOMEPAGE_SEO_COPY_PROMPT.md
  CONTENT_GENERATION_PROMPT.md
  ACCEPTANCE_CRITERIA.md
```

## How to use

1. Give this entire folder/zip to an AI agent working in the repo.
2. Start with `ai-agent/MASTER_IMPLEMENTATION_PROMPT.md`.
3. Have the agent inspect the repo and adapt paths if needed.
4. Have it implement in phases:
   - Technical SEO foundation
   - Service-page metadata/schema
   - Blog routes/content system
   - Homepage SEO copy
   - QA and test fixes
5. Run the repo's standard checks: lint, typecheck, tests, and build.

## Important implementation notes

- Do not expose private portal/admin/login pages to search indexing.
- JSON-LD must match visible page content.
- Each public page should have one H1.
- Each page should have a unique meta title and description.
- Sitemap should include canonical public marketing URLs only.
- Avoid keyword stuffing and unsupported security/compliance guarantees.
