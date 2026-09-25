/**
 * Permission catalog + guards shared by client components, server
 * components, and server actions.
 *
 * Permission keys follow the `module:action` convention, e.g.
 * `tickets:view`, `organizations:delete`, `webhooks:manage`.
 */

export type PermissionScope = "admin" | "portal" | "both";

export const permKey = (moduleKey: string, actionKey: string): string =>
  `${moduleKey}:${actionKey}`;

export interface PermissionGrant {
  module_key: string;
  action_key: string;
}

export function hasPermission(
  keys: string[] | undefined | null,
  moduleKey: string,
  actionKey: string,
): boolean {
  if (!keys || keys.length === 0) return false;
  return keys.includes(permKey(moduleKey, actionKey));
}

export interface EffectivePermissions {
  isSuperAdmin: boolean;
  keys: string[];
  permissions: Array<{ module_key: string; action_key: string }>;
  roles: string[];
}

export function can(
  perms: EffectivePermissions | undefined | null,
  moduleKey: string,
  actionKey: string,
): boolean {
  if (!perms) return false;
  if (perms.isSuperAdmin) return true;
  return hasPermission(perms.keys, moduleKey, actionKey);
}

export const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  tickets: "Tickets",
  documents: "Documents",
  projects: "Projects",
  approvals: "Approvals",
  notifications: "Notifications",
  organizations: "Organizations",
  users: "Users",
  roles: "Roles",
  memberships: "Memberships",
  audit: "Audit",
  billing: "Billing",
  settings: "Settings",
  "bulk-invite": "Bulk Invite",
  governance: "Governance",
  incidents: "Incidents",
  "break-glass": "Break Glass",
  "id-verify": "ID Verify",
  "dmarc-coach": "DMARC Coach",
  "patch-compliance": "Patch Compliance",
  "endpoint-security": "Endpoint Security",
  "m365-hardening": "M365 Hardening",
  "security-suite": "Security Suite",
  "security-ops": "Security Ops",
  "risk-register": "Risk Register",
  tabletop: "Tabletop",
  "phishing-simulations": "Phishing Simulations",
  "incident-response": "Incident Response",
  assets: "Assets",
  findings: "Findings",
  "domain-monitors": "Domain Monitors",
  "website-monitors": "Website Monitors",
  dmarc: "DMARC",
  "license-optimizer": "License Optimizer",
  "uptime-monitor": "Uptime Monitor",
  "field-services": "Field Services",
  status: "Status",
  "status-pages": "Status Pages",
  "camera-calculator": "Camera Calculator",
  "network-port-maps": "Port Maps",
  "hardware-staging": "Hardware Staging",
  "time-entries": "Time Entries",
  runbooks: "Runbooks",
  "sop-library": "SOP Library",
  "backup-dr": "Backup & DR",
  "device-profiles": "Device Profiles",
  "dns-changes": "DNS Changes",
  "saas-audit": "SaaS Audit",
  sharepoint: "SharePoint",
  budgets: "Budgets",
  procurement: "Procurement",
  automation: "Automation",
  scoreboard: "Scoreboard",
  "identity-verification": "Identity Verification",
  "client-knowledge-base": "Knowledge Base",
  "change-requests": "Change Requests",
  "compliance-readiness": "Compliance Readiness",
  onboarding: "Onboarding",
  offboarding: "Offboarding",
  "file-requests": "File Requests",
  "vendor-contracts": "Vendor Contracts",
  "vendor-contacts": "Vendor Contacts",
  "training-hub": "Training Hub",
  "insurance-binder": "Insurance Binder",
  "client-onboarding-command-center": "Onboarding Command Center",
  "dynamic-forms": "Dynamic Forms",
  "satisfaction-pulse": "Satisfaction Pulse",
  store: "Store",
  "store-products": "Store Products",
  "store-promotions": "Store Promotions",
  "store-quotes": "Store Quotes",
  "store-campaigns": "Store Campaigns",
  "store-analytics": "Store Analytics",
  "store-categories": "Store Categories",
  "api-keys": "API Keys",
  webhooks: "Webhooks",
  ai: "AI Tools",
  "edu-automation": "Edu Automation",
  health: "Health",
  sla: "SLA",
  proposals: "Proposals",
  qbr: "QBR Reports",
  "service-catalog": "Service Catalog",
  "business-os": "Business OS",
  final: "More Tools",
  search: "Global Search",
  vendors: "Vendors",
  licenses: "Licenses",
  timeline: "Timeline",
  profile: "Profile",
};

export const PERMISSION_GROUPS: Array<{ key: string; label: string; scope: PermissionScope }> = [
  { key: "core", label: "Core", scope: "both" },
  { key: "admin", label: "Admin", scope: "admin" },
  { key: "security", label: "Security", scope: "both" },
  { key: "operations", label: "Operations", scope: "both" },
  { key: "clients", label: "Clients", scope: "both" },
  { key: "store", label: "Store", scope: "admin" },
  { key: "tools", label: "Tools", scope: "both" },
  { key: "portal", label: "Portal", scope: "portal" },
];

export const ACTION_ORDER = ["view", "create", "edit", "delete", "manage", "export"];
