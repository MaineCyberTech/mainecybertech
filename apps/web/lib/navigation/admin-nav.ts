/**
 * Admin sidebar/navigation catalog.
 *
 * Single source of truth shared by `AdminSidebarContent` (the sidebar) and
 * `AdminSubnav` (contextual sibling tabs). Keep this in sync with the route
 * tree under `app/(admin)/admin/**` and with `ADMIN_ROUTE_PERMISSIONS` in the
 * admin layout — every section must be reachable from here.
 */

export type AdminNavItem = { key: string; href: string; label: string; module?: string };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Core",
    items: [
      { key: "home", href: "/admin", label: "Overview", module: "dashboard" },
      {
        key: "organizations",
        href: "/admin/organizations",
        label: "Organizations",
        module: "organizations",
      },
      { key: "users", href: "/admin/users", label: "Users", module: "users" },
      { key: "roles", href: "/admin/roles", label: "Roles", module: "roles" },
      { key: "permissions", href: "/admin/permissions", label: "Permissions", module: "roles" },
      { key: "tickets", href: "/admin/tickets", label: "Tickets", module: "tickets" },
      { key: "documents", href: "/admin/documents", label: "Documents", module: "documents" },
      { key: "projects", href: "/admin/projects", label: "Projects", module: "projects" },
      { key: "approvals", href: "/admin/approvals", label: "Approvals", module: "approvals" },
      {
        key: "approval-requests",
        href: "/admin/approval-requests",
        label: "Approval Workflow",
        module: "approvals",
      },
      {
        key: "notifications",
        href: "/admin/notifications",
        label: "Notifications",
        module: "notifications",
      },
      { key: "audit", href: "/admin/audit", label: "Audit Log", module: "audit" },
      {
        key: "bulk-invite",
        href: "/admin/bulk-invite",
        label: "Bulk Invite",
        module: "bulk-invite",
      },
    ],
  },
  {
    label: "Security",
    items: [
      { key: "governance", href: "/admin/governance", label: "Governance", module: "governance" },
      { key: "incidents", href: "/admin/incidents", label: "Incidents", module: "incidents" },
      {
        key: "break-glass",
        href: "/admin/break-glass",
        label: "Break Glass",
        module: "break-glass",
      },
      { key: "id-verify", href: "/admin/id-verify", label: "ID Verify", module: "id-verify" },
      {
        key: "dmarc-coach",
        href: "/admin/dmarc-coach",
        label: "DMARC Coach",
        module: "dmarc-coach",
      },
      {
        key: "patch-compliance",
        href: "/admin/patch-compliance",
        label: "Patches",
        module: "patch-compliance",
      },
      {
        key: "endpoint-security",
        href: "/admin/endpoint-security",
        label: "Endpoints",
        module: "endpoint-security",
      },
      {
        key: "m365-hardening",
        href: "/admin/m365-hardening",
        label: "M365",
        module: "m365-hardening",
      },
      {
        key: "security-suite",
        href: "/admin/security-suite",
        label: "Security Suite",
        module: "security-suite",
      },
      {
        key: "security-ops",
        href: "/admin/security-ops",
        label: "Security Ops",
        module: "security-ops",
      },
      { key: "findings", href: "/admin/findings", label: "Findings", module: "findings" },
      { key: "vendors", href: "/admin/vendors", label: "Vendors", module: "vendors" },
      { key: "status", href: "/admin/status", label: "Status", module: "status" },
      {
        key: "status-pages",
        href: "/admin/status-pages",
        label: "Status Pages",
        module: "status-pages",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "assets", href: "/admin/assets", label: "Assets", module: "assets" },
      {
        key: "domain-monitors",
        href: "/admin/domain-monitors",
        label: "DNS",
        module: "domain-monitors",
      },
      {
        key: "website-monitors",
        href: "/admin/website-monitors",
        label: "Websites",
        module: "website-monitors",
      },
      { key: "dmarc", href: "/admin/dmarc", label: "DMARC", module: "dmarc" },
      {
        key: "license-optimizer",
        href: "/admin/license-optimizer",
        label: "License Optimizer",
        module: "license-optimizer",
      },
      { key: "licenses", href: "/admin/licenses", label: "Licenses", module: "licenses" },
      {
        key: "uptime-monitor",
        href: "/admin/uptime-monitor",
        label: "Uptime",
        module: "uptime-monitor",
      },
      {
        key: "field-services",
        href: "/admin/field-services",
        label: "Field",
        module: "field-services",
      },
      { key: "sla", href: "/admin/sla", label: "SLA", module: "sla" },
      { key: "proposals", href: "/admin/proposals", label: "Proposals", module: "proposals" },
      { key: "qbr", href: "/admin/qbr", label: "QBR Reports", module: "qbr" },
      {
        key: "service-catalog",
        href: "/admin/service-catalog",
        label: "Service Catalog",
        module: "service-catalog",
      },
      {
        key: "business-os",
        href: "/admin/business-os",
        label: "Business OS",
        module: "business-os",
      },
      {
        key: "dynamic-forms",
        href: "/admin/dynamic-forms",
        label: "Dynamic Forms",
        module: "dynamic-forms",
      },
      {
        key: "satisfaction-pulse",
        href: "/admin/satisfaction-pulse",
        label: "Satisfaction",
        module: "satisfaction-pulse",
      },
      {
        key: "edu-automation",
        href: "/admin/edu-automation",
        label: "Edu/AI",
        module: "edu-automation",
      },
      { key: "ai", href: "/admin/ai", label: "AI Tools", module: "ai" },
    ],
  },
  {
    label: "Clients",
    items: [
      { key: "onboarding", href: "/admin/onboarding", label: "Onboarding", module: "onboarding" },
      {
        key: "offboarding",
        href: "/admin/offboarding",
        label: "Offboarding",
        module: "offboarding",
      },
      {
        key: "file-requests",
        href: "/admin/file-requests",
        label: "Files",
        module: "file-requests",
      },
      {
        key: "vendor-contracts",
        href: "/admin/vendor-contracts",
        label: "Contracts",
        module: "vendor-contracts",
      },
      {
        key: "vendor-contacts",
        href: "/admin/vendor-contacts",
        label: "Vendor Contacts",
        module: "vendor-contacts",
      },
      {
        key: "training-hub",
        href: "/admin/training-hub",
        label: "Training",
        module: "training-hub",
      },
      {
        key: "insurance-binder",
        href: "/admin/insurance-binder",
        label: "Insurance",
        module: "insurance-binder",
      },
      {
        key: "client-portal",
        href: "/admin/client-portal",
        label: "Client Portal",
        module: "dashboard",
      },
      {
        key: "compliance-readiness",
        href: "/admin/compliance-readiness",
        label: "Compliance",
        module: "compliance-readiness",
      },
      {
        key: "knowledge-base",
        href: "/admin/knowledge-base",
        label: "Knowledge Base",
        module: "client-knowledge-base",
      },
      { key: "cab", href: "/admin/cab", label: "CAB", module: "governance" },
    ],
  },
  {
    label: "Store",
    items: [
      { key: "store", href: "/admin/store", label: "Dashboard", module: "store" },
      { key: "store-products", href: "/admin/store/products", label: "Products", module: "store" },
      {
        key: "store-categories",
        href: "/admin/store/categories",
        label: "Categories",
        module: "store",
      },
      {
        key: "store-promotions",
        href: "/admin/store/promotions",
        label: "Promotions",
        module: "store",
      },
      { key: "store-quotes", href: "/admin/store/quotes", label: "Quotes", module: "store" },
      {
        key: "store-quote-requests",
        href: "/admin/store/quote-requests",
        label: "Quote Requests",
        module: "store",
      },
      { key: "store-leads", href: "/admin/store/leads", label: "Leads", module: "store" },
      {
        key: "store-campaigns",
        href: "/admin/store/campaigns",
        label: "Campaigns",
        module: "store",
      },
      {
        key: "store-operations",
        href: "/admin/store/operations",
        label: "Operations",
        module: "store",
      },
      { key: "store-visuals", href: "/admin/store/visuals", label: "Visuals", module: "store" },
      {
        key: "store-import-export",
        href: "/admin/store/import-export",
        label: "Import / Export",
        module: "store",
      },
      {
        key: "store-analytics",
        href: "/admin/store/analytics",
        label: "Analytics",
        module: "store",
      },
      {
        key: "store-proposals",
        href: "/admin/store/proposals",
        label: "Proposals",
        module: "store",
      },
      { key: "store-bundles", href: "/admin/store/bundles", label: "Bundles", module: "store" },
      { key: "store-ladders", href: "/admin/store/ladders", label: "Ladders", module: "store" },
      {
        key: "store-bundle-calculator",
        href: "/admin/store/bundle-calculator",
        label: "Bundle Calculator",
        module: "store",
      },
      {
        key: "store-comparisons",
        href: "/admin/store/comparisons",
        label: "Comparisons",
        module: "store",
      },
      {
        key: "store-case-studies",
        href: "/admin/store/case-studies",
        label: "Case Studies",
        module: "store",
      },
      {
        key: "store-testimonials",
        href: "/admin/store/testimonials",
        label: "Testimonials",
        module: "store",
      },
      {
        key: "store-trust-badges",
        href: "/admin/store/trust-badges",
        label: "Trust Badges",
        module: "store",
      },
      { key: "store-faqs", href: "/admin/store/faqs", label: "FAQs", module: "store" },
      {
        key: "store-seo-pages",
        href: "/admin/store/seo-pages",
        label: "SEO Pages",
        module: "store",
      },
      { key: "store-quiz", href: "/admin/store/quiz", label: "Quiz", module: "store" },
      {
        key: "store-recommendations",
        href: "/admin/store/recommendations",
        label: "Recommendations",
        module: "store",
      },
      {
        key: "store-lead-magnets",
        href: "/admin/store/lead-magnets",
        label: "Lead Magnets",
        module: "store",
      },
      {
        key: "store-lifecycle",
        href: "/admin/store/lifecycle",
        label: "Lifecycle",
        module: "store",
      },
      { key: "store-nurture", href: "/admin/store/nurture", label: "Nurture", module: "store" },
      {
        key: "store-fulfillment",
        href: "/admin/store/fulfillment",
        label: "Fulfillment",
        module: "store",
      },
      {
        key: "store-content-audit",
        href: "/admin/store/content-audit",
        label: "Content Audit",
        module: "store",
      },
      {
        key: "store-dependencies",
        href: "/admin/store/dependencies",
        label: "Dependencies",
        module: "store",
      },
      {
        key: "store-profitability",
        href: "/admin/store/profitability",
        label: "Profitability",
        module: "store",
      },
      {
        key: "store-portal-services",
        href: "/admin/store/portal-services",
        label: "Portal Services",
        module: "store",
      },
      { key: "store-audit", href: "/admin/store/audit", label: "Store Audit", module: "store" },
    ],
  },
  {
    label: "Tools",
    items: [
      { key: "api-keys", href: "/admin/api-keys", label: "API Keys", module: "api-keys" },
      { key: "webhooks", href: "/admin/webhooks", label: "Webhooks", module: "webhooks" },
      { key: "final", href: "/admin/final", label: "More Tools", module: "final" },
      { key: "health", href: "/admin/health", label: "Health", module: "health" },
      { key: "settings", href: "/admin/settings", label: "Settings", module: "settings" },
    ],
  },
];

/** Flat lookup of nav items by their stable `key`. */
export const ADMIN_NAV_BY_KEY: Record<string, AdminNavItem> = Object.fromEntries(
  ADMIN_NAV_GROUPS.flatMap((g) => g.items).map((item) => [item.key, item]),
);

/** Find the group that contains the item with `key`. */
export function adminGroupForKey(key: string): AdminNavGroup | undefined {
  return ADMIN_NAV_GROUPS.find((g) => g.items.some((i) => i.key === key));
}
