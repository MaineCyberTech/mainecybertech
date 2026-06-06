import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import PortalHeaderActions from "@/components/portal/PortalHeaderActions";
import NotificationBell from "@/components/NotificationBell";
import OrgSwitcher from "@/components/portal/OrgSwitcher";
import PortalGlobalSearch from "@/components/portal/PortalGlobalSearch";
import { getUnreadCount } from "@/lib/notifications-actions";
import { setActiveOrg } from "@/lib/org-actions";

export default async function PortalLayout({
  children
}: {
  children: ReactNode;
}) {
  // Run independent calls in parallel
  const [userResult, membershipResult, unreadCountResult, allOrgsResult] = await Promise.all([
    getApiClient().users.me().catch(() => null),
    getApprovedMembership().catch(() => null),
    getUnreadCount().catch(() => 0),
    getApiClient().organizations.list().catch(() => [] as any[]),
  ]);

  if (!userResult?.userId) {
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
    getApiClient().organizations.get(membership.organization_id).catch(() => null),
    getApiClient().memberships.list({ userId: user.userId, status: "approved" }).catch(() => [] as any[]),
  ]);

  const orgIds = new Set(allMemberships.map((m: any) => m.organization_id));
  const userOrgs = allOrgs.filter((o: any) => orgIds.has(o.id)).map((o: any) => ({ id: o.id, name: o.name }));

  const brandColor = org?.brand_color ?? "#059669";
  const logoUrl = org?.logo_url ?? null;

  return (
    <div className="min-h-screen bg-[#0A1118] text-slate-50">
      <header className="sticky top-0 z-40 border-b bg-[#0A1118]/85 backdrop-blur-md"
        style={{ borderColor: `${brandColor}33` }}>
        <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt={org?.name ?? ""} className="h-6 w-6 rounded object-contain sm:h-8 sm:w-8" />
                ) : null}
                <div>
                  <div className="cyber-header-title">
                    {logoUrl ? org?.name : <>Maine <span style={{ color: brandColor }}>CyberTech</span></>}
                  </div>
                  <div className="mt-1">
                    <OrgSwitcher orgs={userOrgs} activeOrgId={membership.organization_id} setActiveOrgAction={setActiveOrg} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <Link href="/portal/profile">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-emerald-600/20 text-xs font-bold text-emerald-400 transition hover:bg-emerald-600/30">
                    {user?.avatarUrl ? (
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

          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Secure client workspace
          </p>
        </div>
      </header>

      <main className="cyber-main">{children}</main>
    </div>
  );
}
