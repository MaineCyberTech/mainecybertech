/**
 * Portal sidebar/navigation catalog.
 *
 * Single source of truth shared by `PortalSidebarContent` (the sidebar) and
 * `PortalSubnav` (contextual sibling tabs). Keep this in sync with the route
 * tree under `app/(portal)/portal/**` and with `PORTAL_ROUTE_PERMISSIONS` in
 * the portal layout — every section must be reachable from here.
 */

export type PortalNavItem = { key: string; href: string; label: string; module?: string };
export type PortalNavGroup = { label: string; items: PortalNavItem[] };

export const PORTAL_NAV_GROUPS: PortalNavGroup[] = [
  {
    label: "Core",
    items: [
      { key: "dashboard", href: "/portal/dashboard", label: "Dashboard", module: "dashboard" },
      { key: "projects", href: "/portal/projects", label: "Projects", module: "projects" },
      { key: "documents", href: "/portal/documents", label: "Documents", module: "documents" },
      { key: "support", href: "/portal/support", label: "Support", module: "tickets" },
      { key: "billing", href: "/portal/billing", label: "Billing", module: "billing" },
      { key: "approvals", href: "/portal/approvals", label: "Approvals", module: "approvals" },
      {
        key: "notifications",
        href: "/portal/notifications",
        label: "Notifications",
        module: "notifications",
      },
      { key: "feedback", href: "/portal/feedback", label: "Feedback" },
      { key: "profile", href: "/portal/profile", label: "Profile", module: "profile" },
    ],
  },
  {
    label: "Operations",
    items: [
      { key: "assets", href: "/portal/assets", label: "Assets", module: "assets" },
      { key: "findings", href: "/portal/findings", label: "Findings", module: "findings" },
      { key: "qbr", href: "/portal/qbr", label: "QBR Reports", module: "qbr" },
      { key: "sla", href: "/portal/sla", label: "SLA", module: "sla" },
      {
        key: "time-entries",
        href: "/portal/time-entries",
        label: "Time Entries",
        module: "time-entries",
      },
      {
        key: "field-services",
        href: "/portal/field-services",
        label: "Field Services",
        module: "field-services",
      },
      {
        key: "unifi-site-surveys",
        href: "/portal/unifi-site-surveys",
        label: "UniFi Surveys",
        module: "field-services",
      },
      {
        key: "network-port-maps",
        href: "/portal/network-port-maps",
        label: "Port Maps",
        module: "network-port-maps",
      },
      {
        key: "network-diagrams",
        href: "/portal/network-diagrams",
        label: "Network Diagrams",
        module: "network-port-maps",
      },
      {
        key: "camera-calculator",
        href: "/portal/camera-calculator",
        label: "Camera Calculator",
        module: "camera-calculator",
      },
      {
        key: "file-requests",
        href: "/portal/file-requests",
        label: "Files",
        module: "file-requests",
      },
      {
        key: "hardware-staging",
        href: "/portal/hardware-staging",
        label: "Hardware Staging",
        module: "hardware-staging",
      },
      {
        key: "change-requests",
        href: "/portal/change-requests",
        label: "Change Requests",
        module: "change-requests",
      },
      {
        key: "dns-changes",
        href: "/portal/dns-changes",
        label: "DNS Changes",
        module: "dns-changes",
      },
      {
        key: "procurement",
        href: "/portal/procurement",
        label: "Procurement",
        module: "procurement",
      },
      { key: "budgets", href: "/portal/budgets", label: "Budgets", module: "budgets" },
      { key: "automation", href: "/portal/automation", label: "Automation", module: "automation" },
    ],
  },
  {
    label: "Security",
    items: [
      {
        key: "security-suite",
        href: "/portal/security-suite",
        label: "Security Suite",
        module: "security-suite",
      },
      {
        key: "security-ops",
        href: "/portal/security-ops",
        label: "Security Ops",
        module: "security-ops",
      },
      {
        key: "domain-monitors",
        href: "/portal/domain-monitors",
        label: "Domain Monitors",
        module: "domain-monitors",
      },
      { key: "governance", href: "/portal/governance", label: "Governance", module: "governance" },
      {
        key: "data-retention",
        href: "/portal/data-retention",
        label: "Data Retention",
        module: "governance",
      },
      {
        key: "risk-register",
        href: "/portal/risk-register",
        label: "Risk Register",
        module: "risk-register",
      },
      { key: "tabletop", href: "/portal/tabletop", label: "Tabletop", module: "tabletop" },
      {
        key: "incident-response",
        href: "/portal/incident-response",
        label: "Incident Response",
        module: "incident-response",
      },
      { key: "backup-dr", href: "/portal/backup-dr", label: "Backup & DR", module: "backup-dr" },
      { key: "runbooks", href: "/portal/runbooks", label: "Runbooks", module: "runbooks" },
      {
        key: "sop-library",
        href: "/portal/sop-library",
        label: "SOP Library",
        module: "sop-library",
      },
      {
        key: "break-glass",
        href: "/portal/break-glass",
        label: "Break Glass",
        module: "break-glass",
      },
      {
        key: "patch-compliance",
        href: "/portal/patch-compliance",
        label: "Patches",
        module: "patch-compliance",
      },
      {
        key: "endpoint-security",
        href: "/portal/endpoint-security",
        label: "Endpoints",
        module: "endpoint-security",
      },
      {
        key: "m365-hardening",
        href: "/portal/m365-hardening",
        label: "M365",
        module: "m365-hardening",
      },
      {
        key: "phishing-simulations",
        href: "/portal/phishing-simulations",
        label: "Phishing Sims",
        module: "phishing-simulations",
      },
      {
        key: "identity-verification",
        href: "/portal/identity-verification",
        label: "Identity Verification",
        module: "identity-verification",
      },
      {
        key: "compliance-readiness",
        href: "/portal/compliance-readiness",
        label: "Compliance",
        module: "compliance-readiness",
      },
      {
        key: "client-knowledge-base",
        href: "/portal/client-knowledge-base",
        label: "Knowledge Base",
        module: "client-knowledge-base",
      },
      { key: "ai-triage", href: "/portal/ai-triage", label: "AI Triage", module: "ai" },
      { key: "status", href: "/portal/status", label: "Status", module: "status" },
      {
        key: "status-pages",
        href: "/portal/status-pages",
        label: "Status Pages",
        module: "status-pages",
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        key: "vendor-contracts",
        href: "/portal/vendor-contracts",
        label: "Vendors",
        module: "vendor-contracts",
      },
      {
        key: "vendor-contacts",
        href: "/portal/vendor-contacts",
        label: "Vendor Contacts",
        module: "vendor-contacts",
      },
      {
        key: "service-catalog",
        href: "/portal/service-catalog",
        label: "Services",
        module: "service-catalog",
      },
      {
        key: "services",
        href: "/portal/services",
        label: "My Services",
        module: "service-catalog",
      },
      { key: "store", href: "/portal/store", label: "Store", module: "store" },
      { key: "proposals", href: "/portal/proposals", label: "Proposals", module: "proposals" },
      {
        key: "training-hub",
        href: "/portal/training-hub",
        label: "Training",
        module: "training-hub",
      },
      {
        key: "insurance-binder",
        href: "/portal/insurance-binder",
        label: "Insurance",
        module: "insurance-binder",
      },
      {
        key: "license-optimizer",
        href: "/portal/license-optimizer",
        label: "Licenses",
        module: "license-optimizer",
      },
      {
        key: "dmarc-coach",
        href: "/portal/dmarc-coach",
        label: "DMARC Coach",
        module: "dmarc-coach",
      },
      { key: "sharepoint", href: "/portal/sharepoint", label: "SharePoint", module: "sharepoint" },
      { key: "saas-audit", href: "/portal/saas-audit", label: "SaaS Audit", module: "saas-audit" },
      { key: "scoreboard", href: "/portal/scoreboard", label: "Scoreboard", module: "scoreboard" },
      {
        key: "client-portal",
        href: "/portal/client-portal",
        label: "Client Portal",
        module: "dashboard",
      },
    ],
  },
  {
    label: "Advanced",
    items: [
      { key: "timeline", href: "/portal/timeline", label: "Timeline", module: "timeline" },
      {
        key: "edu-automation",
        href: "/portal/edu-automation",
        label: "Edu Automation",
        module: "edu-automation",
      },
      {
        key: "device-profiles",
        href: "/portal/device-profiles",
        label: "Device Profiles",
        module: "device-profiles",
      },
      {
        key: "offboarding",
        href: "/portal/offboarding",
        label: "Offboarding",
        module: "offboarding",
      },
      {
        key: "client-onboarding-command-center",
        href: "/portal/client-onboarding-command-center",
        label: "Onboarding Center",
        module: "client-onboarding-command-center",
      },
      {
        key: "dynamic-client-forms-builder",
        href: "/portal/dynamic-client-forms-builder",
        label: "Forms Builder",
        module: "dynamic-forms",
      },
      {
        key: "uptime-monitor",
        href: "/portal/uptime-monitor",
        label: "Uptime",
        module: "uptime-monitor",
      },
      { key: "cab", href: "/portal/cab", label: "CAB", module: "governance" },
    ],
  },
];

/** Flat lookup of nav items by their stable `key`. */
export const PORTAL_NAV_BY_KEY: Record<string, PortalNavItem> = Object.fromEntries(
  PORTAL_NAV_GROUPS.flatMap((g) => g.items).map((item) => [item.key, item]),
);

/** Find the group that contains the item with `key`. */
export function portalGroupForKey(key: string): PortalNavGroup | undefined {
  return PORTAL_NAV_GROUPS.find((g) => g.items.some((i) => i.key === key));
}
