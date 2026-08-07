import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import PortalHeaderActions from "@/components/portal/PortalHeaderActions";
import NotificationBell from "@/components/NotificationBell";
import OrgSwitcher from "@/components/portal/OrgSwitcher";
import SuperAdminOrgSwitcher from "@/components/admin/SuperAdminOrgSwitcher";
import PortalGlobalSearch from "@/components/portal/PortalGlobalSearch";
import { getUnreadCount } from "@/lib/notifications-actions";
import { setActiveOrg } from "@/lib/org-actions";
import PortalSidebarLayout from "@/components/portal/PortalSidebarLayout";
import RouteGuard from "@/components/RouteGuard";

const PORTAL_ROUTE_PERMISSIONS: Record<string, { module: string; action?: string }> = {
  "/portal/dashboard": { module: "dashboard" },
  "/portal/projects": { module: "projects" },
  "/portal/documents": { module: "documents" },
  "/portal/support": { module: "tickets" },
  "/portal/billing": { module: "billing" },
  "/portal/approvals": { module: "approvals" },
  "/portal/notifications": { module: "notifications" },
  "/portal/assets": { module: "assets" },
  "/portal/findings": { module: "findings" },
  "/portal/qbr": { module: "qbr" },
  "/portal/sla": { module: "sla" },
  "/portal/time-entries": { module: "time-entries" },
  "/portal/field-services": { module: "field-services" },
  "/portal/file-requests": { module: "file-requests" },
  "/portal/security-suite": { module: "security-suite" },
  "/portal/security-ops": { module: "security-ops" },
  "/portal/domain-monitors": { module: "domain-monitors" },
  "/portal/governance": { module: "governance" },
  "/portal/status": { module: "status" },
  "/portal/status-pages": { module: "status-pages" },
  "/portal/vendor-contracts": { module: "vendor-contracts" },
  "/portal/vendor-contacts": { module: "vendor-contacts" },
  "/portal/service-catalog": { module: "service-catalog" },
  "/portal/training-hub": { module: "training-hub" },
  "/portal/insurance-binder": { module: "insurance-binder" },
  "/portal/timeline": { module: "timeline" },
  "/portal/edu-automation": { module: "edu-automation" },
  "/portal/saas-audit": { module: "saas-audit" },
  "/portal/device-profiles": { module: "device-profiles" },
  "/portal/dns-changes": { module: "dns-changes" },
  "/portal/license-optimizer": { module: "license-optimizer" },
  "/portal/dmarc-coach": { module: "dmarc-coach" },
  "/portal/uptime-monitor": { module: "uptime-monitor" },
  "/portal/incident-response": { module: "incident-response" },
  "/portal/backup-dr": { module: "backup-dr" },
  "/portal/runbooks": { module: "runbooks" },
  "/portal/sop-library": { module: "sop-library" },
  "/portal/break-glass": { module: "break-glass" },
  "/portal/patch-compliance": { module: "patch-compliance" },
  "/portal/endpoint-security": { module: "endpoint-security" },
  "/portal/m365-hardening": { module: "m365-hardening" },
  "/portal/offboarding": { module: "offboarding" },
  "/portal/onboarding": { module: "onboarding" },
  "/portal/client-onboarding-command-center": { module: "client-onboarding-command-center" },
  "/portal/dynamic-client-forms-builder": { module: "dynamic-forms" },
  "/portal/identity-verification": { module: "identity-verification" },
  "/portal/compliance-readiness": { module: "compliance-readiness" },
  "/portal/client-knowledge-base": { module: "client-knowledge-base" },
  "/portal/change-requests": { module: "change-requests" },
  "/portal/scoreboard": { module: "scoreboard" },
  "/portal/phishing-simulations": { module: "phishing-simulations" },
  "/portal/hardware-staging": { module: "hardware-staging" },
  "/portal/camera-calculator": { module: "camera-calculator" },
  "/portal/network-port-maps": { module: "network-port-maps" },
  "/portal/sharepoint": { module: "sharepoint" },
  "/portal/automation": { module: "automation" },
  "/portal/procurement": { module: "procurement" },
  "/portal/budgets": { module: "budgets" },
  "/portal/risk-register": { module: "risk-register" },
  "/portal/tabletop": { module: "tabletop" },
  "/portal/proposals": { module: "proposals" },
  "/portal/store": { module: "store" },
  "/portal/profile": { module: "profile" },
  "/portal/unifi-site-surveys": { module: "field-services" },
  "/portal/data-retention": { module: "governance" },
  "/portal/network-diagrams": { module: "network-port-maps" },
  "/portal/ai-triage": { module: "ai", action: "view" },
};

export default async function PortalLayout({ children }: { children: ReactNode }) {
  // Run independent calls in parallel
  const [userResult, membershipResult, unreadCountResult, allOrgsResult, permissionsResult] =
    await Promise.all([
      getApiClient()
        .users.me()
        .catch((err) => {
          // Only treat an explicit auth failure (401/403) as "not signed in".
          // Transient API errors (429 rate limit, 5xx) must NOT redirect to
          // /login — the middleware would bounce an authenticated user back
          // to /portal/dashboard, producing an infinite redirect loop.
          const status = (err as { status?: number })?.status;
          return status === 401 || status === 403 ? null : ({ error: true } as any);
        }),
      getApprovedMembership().catch(() => null),
      getUnreadCount().catch(() => 0),
      getApiClient()
        .organizations.list()
        .catch(() => [] as any[]),
      getApiClient()
        .permissions.getMyPermissions()
        .catch(() => null),
    ]);

  if (!userResult?.userId) {
    if ((userResult as { error?: boolean })?.error) {
      throw new Error("Unable to load your profile. Please try again.");
    }
    redirect("/login");
  }

  if (!membershipResult) {
    redirect("/pending");
  }

  const user = userResult;
  const membership = membershipResult;
  const unreadCount = unreadCountResult;
  const allOrgs = allOrgsResult;

  // Fetch org details and memberships in parallel (both depend on batch 1)
  const [org, allMemberships] = await Promise.all([
    getApiClient()
      .organizations.get(membership.organization_id)
      .catch(() => null),
    getApiClient()
      .memberships.list({ userId: user.userId, status: "approved" })
      .catch(() => [] as any[]),
  ]);

  const orgIds = new Set(allMemberships.map((m: any) => m.organization_id));
  const userOrgs = allOrgs
    .filter((o: any) => orgIds.has(o.id))
    .map((o: any) => ({ id: o.id, name: o.name }));

  const brandColor = org?.brand_color ?? "#059669";
  const logoUrl = org?.logo_url ?? null;

  return (
    <div className="min-h-screen bg-cyber-base text-slate-50">
      <header
        className="sticky top-0 z-40 border-b bg-cyber-base/85 backdrop-blur-md"
        style={{ borderColor: `${brandColor}33` }}
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={org?.name ?? ""}
                  className="h-6 w-6 rounded object-contain sm:h-8 sm:w-8"
                />
              ) : null}
              <div>
                <div className="cyber-header-title">
                  {logoUrl ? (
                    org?.name
                  ) : (
                    <>
                      Maine <span style={{ color: brandColor }}>CyberTech</span>
                    </>
                  )}
                </div>
                <div className="mt-1">
                  {permissionsResult?.isSuperAdmin ? (
                    <SuperAdminOrgSwitcher />
                  ) : (
                    <OrgSwitcher
                      orgs={userOrgs}
                      activeOrgId={membership.organization_id}
                      setActiveOrgAction={setActiveOrg}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/portal/profile">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-emerald-600/20 text-xs font-bold text-emerald-400 transition hover:bg-emerald-600/30">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (user?.fullName ?? user?.email ?? "U")[0].toUpperCase()
                  )}
                </div>
              </Link>
              <NotificationBell basePath="/portal" initialUnread={unreadCount} />
              <PortalHeaderActions />
            </div>
          </div>

          <div className="mt-3">
            <PortalGlobalSearch />
          </div>

          <p className="mt-1 text-xs text-slate-400 sm:text-sm">Secure client workspace</p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <PortalSidebarLayout
          permissions={
            permissionsResult
              ? { isSuperAdmin: permissionsResult.isSuperAdmin, keys: permissionsResult.keys }
              : null
          }
        >
          <RouteGuard rules={PORTAL_ROUTE_PERMISSIONS} homeHref="/portal/dashboard">
            {children}
          </RouteGuard>
        </PortalSidebarLayout>
      </div>
    </div>
  );
}
