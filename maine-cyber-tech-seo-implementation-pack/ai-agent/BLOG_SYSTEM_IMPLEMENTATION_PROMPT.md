# Blog System Implementation Prompt

Create a simple SEO-ready blog system for Maine Cyber Tech.

## Goal

Add a lightweight repo-editable blog system to support local SEO posts.

## Tasks

1. Add `apps/web/lib/seo/blog.ts`.
2. Create `/blog` listing route.
3. Create `/blog/[slug]` detail route.
4. Choose the lowest-complexity content source:
   - Existing MDX system, if present.
   - Markdown files, if supported.
   - TypeScript object config, if no content system exists.
5. Add Article JSON-LD to blog detail pages.
6. Add Breadcrumb JSON-LD to blog detail pages.
7. Add related service links.
8. Add blog URLs to sitemap.
9. Return `notFound()` for missing slugs.
10. Build first post stubs for the initial P0 posts.

## Initial P0 post stubs

- small-business-it-support-checklist-maine
- microsoft-365-security-checklist-maine-small-business
- business-wifi-planning-checklist-maine
- security-camera-system-planning-checklist-maine-businesses

## Quality criteria

- Every post has one H1.
- Every post has unique meta title and description.
- Every post links to `/contact`.
- Every post links to at least one relevant service page.
- Blog pages are included in sitemap only if public and implemented.
