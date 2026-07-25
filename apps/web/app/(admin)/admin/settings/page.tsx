import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmailTestClient from "./EmailTestClient";

export const metadata = { title: "Admin Settings - Maine CyberTech" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminAccess();

  return (
    <AdminPageShell title="Settings">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/admin" }, { label: "Settings" }]} />
      <AdminSubnav current="settings" />
      <div className="mx-auto max-w-2xl space-y-8">
        <section className="cyber-panel rounded-lg border border-white/10 bg-[#0A1118]/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">Email Configuration</h2>
          <p className="mb-6 text-sm text-slate-400">
            Send a test email to verify SMTP settings are working correctly.
          </p>
          <EmailTestClient />
        </section>
      </div>
    </AdminPageShell>
  );
}
