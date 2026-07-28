import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Proposal - Admin - Maine CyberTech" };

export default async function NewProposalPage() {
  await requireAdminAccess();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Proposals", href: "/admin/proposals" },
            { label: "New Proposal" },
          ]}
        />
      }
      subnav={<AdminSubnav current="proposals" />}
      title="New Proposal"
    >
      <div className="cyber-panel">
        <Link
          href="/admin/proposals"
          className="mb-4 inline-block text-sm text-slate-400 transition hover:text-emerald-400"
        >
          &larr; Back to Proposals
        </Link>
        <p className="text-slate-400">Proposal creation form will be available soon.</p>
      </div>
    </AdminPageShell>
  );
}
