import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import NotificationsPageClient from "@/components/NotificationsPageClient";

export const metadata = { title: "Notifications - Portal - Maine CyberTech" };

export default function PortalNotificationsPage() {
  return (
    <div className="space-y-6">
      <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Notifications" }]} />
      <PortalSubnav current="notifications" />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Notifications</h1>
          <p className="mt-3 text-slate-400">View your notification history.</p>
        </div>
      </div>

      <NotificationsPageClient basePath="/portal" />
    </div>
  );
}
