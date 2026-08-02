import type { ReactNode } from "react";
import { getApiClient } from "@/lib/api";
import { redirect } from "next/navigation";
import AdminHeaderActions from "@/components/admin/AdminHeaderActions";
import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import NotificationBell from "@/components/NotificationBell";
import { getUnreadCount } from "@/lib/notifications-actions";
import AdminSidebarLayout from "@/components/admin/AdminSidebarLayout";
import RouteGuard from "@/components/RouteGuard";
import SuperAdminOrgSwitcher from "@/components/admin/SuperAdminOrgSwitcher";

export const dynamic = "force-dynamic";

const ADMIN_ROUTE_PERMISSIONS: Record<string, { module: string; action?: string }> = {
  "/admin/organizations": { module: "organizations" },
  "/admin/users": { module: "users" },
  "/admin/roles": { module: "roles" },
  "/admin/tickets": { module: "tickets" },
  "/admin/documents": { module: "documents" },
  "/admin/projects": { module: "projects" },
  "/admin/approvals": { module: "approvals" },
  "/admin/governance": { module: "governance" },
  "/admin/incidents": { module: "incidents" },
  "/admin/break-glass": { module: "break-glass" },
  "/admin/id-verify": { module: "id-verify" },
  "/admin/dmarc-coach": { module: "dmarc-coach" },
  "/admin/patch-compliance": { module: "patch-compliance" },
  "/admin/endpoint-security": { module: "endpoint-security" },
  "/admin/m365-hardening": { module: "m365-hardening" },
  "/admin/assets": { module: "assets" },
  "/admin/domain-monitors": { module: "domain-monitors" },
  "/admin/website-monitors": { module: "website-monitors" },
  "/admin/dmarc": { module: "dmarc" },
  "/admin/license-optimizer": { module: "license-optimizer" },
  "/admin/licenses": { module: "licenses" },
  "/admin/uptime-monitor": { module: "uptime-monitor" },
  "/admin/field-services": { module: "field-services" },
  "/admin/offboarding": { module: "offboarding" },
  "/admin/onboarding": { module: "onboarding" },
  "/admin/file-requests": { module: "file-requests" },
  "/admin/vendor-contracts": { module: "vendor-contracts" },
  "/admin/vendor-contacts": { module: "vendor-contacts" },
  "/admin/training-hub": { module: "training-hub" },
  "/admin/insurance-binder": { module: "insurance-binder" },
  "/admin/store": { module: "store" },
  "/admin/api-keys": { module: "api-keys" },
  "/admin/webhooks": { module: "webhooks" },
  "/admin/ai": { module: "ai" },
  "/admin/edu-automation": { module: "edu-automation" },
  "/admin/final": { module: "final" },
  "/admin/health": { module: "health" },
  "/admin/audit": { module: "audit" },
  "/admin/bulk-invite": { module: "bulk-invite" },
  "/admin/notifications": { module: "notifications" },
  "/admin/sla": { module: "sla" },
  "/admin/proposals": { module: "proposals" },
  "/admin/qbr": { module: "qbr" },
  "/admin/service-catalog": { module: "service-catalog" },
  "/admin/business-os": { module: "business-os" },
  "/admin/findings": { module: "findings" },
  "/admin/security-suite": { module: "security-suite" },
  "/admin/security-ops": { module: "security-ops" },
  "/admin/status": { module: "status" },
  "/admin/status-pages": { module: "status-pages" },
  "/admin/vendors": { module: "vendors" },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let user;
  try {
    user = await getApiClient().users.me();
  } catch {
    user = null;
  }

  if (!user?.userId) {
    redirect("/login");
  }

  let unreadCount = 0;
  try {
    unreadCount = await getUnreadCount();
  } catch {
    unreadCount = 0;
  }

  return (
    <div className="min-h-screen bg-[#0A1118] text-slate-50">
      <header className="sticky top-0 z-40 border-b border-emerald-600/20 bg-[#0A1118]/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="cyber-header-title">
              Maine <span className="text-emerald-600">CyberTech</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block">
                <AdminGlobalSearch />
              </div>
              <SuperAdminOrgSwitcher />
              <NotificationBell basePath="/admin" initialUnread={unreadCount} />
              <AdminHeaderActions />
            </div>
          </div>

          <div className="mt-2 sm:hidden">
            <AdminGlobalSearch />
          </div>

          <p className="mt-1 text-xs text-slate-400 sm:text-sm">Admin operations workspace</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <AdminSidebarLayout>
          <RouteGuard rules={ADMIN_ROUTE_PERMISSIONS} homeHref="/admin">
            {children}
          </RouteGuard>
        </AdminSidebarLayout>
      </main>
    </div>
  );
}
