# Maine Cyber Tech SEO Implementation Prompt Pack

## Prompt 1 — Technical SEO Foundation

Implement the technical SEO foundation for the Maine Cyber Tech Next.js app.

Add:
- apps/web/lib/seo/site.ts
- apps/web/lib/seo/metadata.ts
- apps/web/lib/seo/schema.ts
- apps/web/app/sitemap.ts
- apps/web/app/robots.ts
- apps/web/components/seo/JsonLd.tsx
- apps/web/components/seo/LocalBusinessJsonLd.tsx
- apps/web/components/seo/BreadcrumbJsonLd.tsx

Use https://www.mainecybertech.com as the canonical marketing domain.

Keep these routes out of search indexing:
- /admin
- /portal
- /login
- /signup
- /forgot-password
- /password-reset
- /api

Do not break existing build, lint, test, or typecheck.

## Prompt 2 — Service Page SEO

Update the service page system so every service has:
- unique metadata
- one H1
- service-specific intro copy
- internal links
- contact CTA
- Service JSON-LD
- Breadcrumb JSON-LD

Service slugs:
- managed-it-services
- cybersecurity
- network-installation
- security-systems
- microsoft-365-support
- cloud

## Prompt 3 — Blog System

Create a simple repo-editable blog system for local SEO posts.

Add:
- /blog
- /blog/[slug]
- blog metadata config
- Article JSON-LD
- Breadcrumb JSON-LD
- related service links
- sitemap inclusion

Create initial content stubs for:
- small-business-it-support-checklist-maine
- microsoft-365-security-checklist-maine-small-business
- business-wifi-planning-checklist-maine
- security-camera-system-planning-checklist-maine-businesses

## Prompt 4 — Homepage SEO Copy

Rewrite homepage copy around:
- Managed IT
- Cybersecurity
- Microsoft 365
- Business Wi-Fi
- Network installation
- UniFi systems
- Security cameras
- Cloud backup
- Disaster recovery
- Maine small businesses, nonprofits, churches, marinas, warehouses, and local organizations

Use professional, practical, local language.

## Prompt 5 — Blog Draft Generation

Use the blog generation prompt in AI_BLOG_GENERATION_PROMPTS.md to draft each P0 post.

Each post must include:
- meta title
- meta description
- slug
- primary keyword
- secondary keywords
- H1
- H2s
- FAQ
- internal links
- CTA
- image alt text suggestions
