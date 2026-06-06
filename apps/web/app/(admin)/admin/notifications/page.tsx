import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import NotificationsPageClient from "@/components/NotificationsPageClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications - Admin - Maine CyberTech" };

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Notifications" }]} />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Notifications</h1>
          <p className="mt-3 text-slate-400">View your notification history across all organizations.</p>
        </div>
      </div>

      <NotificationsPageClient basePath="/admin" />
    </div>
  );
}

