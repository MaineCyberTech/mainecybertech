# Service Page Implementation Prompt

Update the Maine Cyber Tech service page system for local SEO.

## Tasks

1. Add or merge `apps/web/lib/seo/services.ts`.
2. Update dynamic service route to use service SEO config.
3. Add `generateMetadata` for each service based on slug.
4. Add one H1 per service page.
5. Add service intro copy using service config.
6. Add Service JSON-LD using `buildServiceSchema`.
7. Add Breadcrumb JSON-LD if breadcrumbs are visible or added.
8. Add links to `/contact` and related blog/service pages.
9. Ensure unknown slugs return `notFound()`.
10. Ensure static generation via `generateStaticParams()` if consistent with existing Next.js patterns.

## Required service slugs

- managed-it-services
- cybersecurity
- network-installation
- security-systems
- microsoft-365-support
- cloud

## Quality criteria

- One H1.
- Unique metadata.
- Clear service-specific copy.
- Internal link to Contact.
- No keyword stuffing.
- No unsupported compliance or security guarantees.
