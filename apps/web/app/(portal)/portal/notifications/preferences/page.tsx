import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import NotificationPreferencesClient from "./NotificationPreferencesClient";

export const metadata = { title: "Notification Preferences - Portal - Maine CyberTech" };

export default function PortalNotificationsPreferencesPage() {
  return (
    <div className="space-y-6">
      <PortalBreadcrumbs items={[
        { label: "Portal", href: "/portal/dashboard" },
        { label: "Notifications", href: "/portal/notifications" },
        { label: "Preferences" }
      ]} />
      <PortalSubnav current="notifications" />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Notification Preferences</h1>
          <p className="mt-3 text-slate-400">Choose which notifications you receive and how.</p>
        </div>
      </div>

      <NotificationPreferencesClient />
    </div>
  );
}
