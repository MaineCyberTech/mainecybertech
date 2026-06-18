import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmailTestClient from "./EmailTestClient";

export const metadata = { title: "Admin Settings - Maine CyberTech" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminAccess();

  return (
    <AdminPageShell title="Settings">
      <AdminBreadcrumbs
        items={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]}
      />
      <AdminSubnav current="settings" />
      <div className="mx-auto max-w-2xl space-y-8">
        <section className="cyber-panel rounded-lg border border-white/10 bg-[#0A1118]/60 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Email Configuration
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Send a test email to verify SMTP settings are working correctly.
          </p>
          <EmailTestClient />
        </section>
      </div>
    </AdminPageShell>
  );
}
