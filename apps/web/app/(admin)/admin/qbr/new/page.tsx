import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Generate QBR Report - Admin - Maine CyberTech" };

export default async function NewQbrPage() {
  await requireAdminAccess();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "QBR Reports", href: "/admin/qbr" },
            { label: "New Report" },
          ]}
        />
      }
      subnav={<AdminSubnav current="qbr" />}
      title="Generate QBR Report"
    >
      <div className="cyber-panel">
        <Link
          href="/admin/qbr"
          className="mb-4 inline-block text-sm text-slate-400 transition hover:text-emerald-400"
        >
          &larr; Back to QBR Reports
        </Link>
        <p className="text-slate-400">QBR report generation form will be available soon.</p>
      </div>
    </AdminPageShell>
  );
}
