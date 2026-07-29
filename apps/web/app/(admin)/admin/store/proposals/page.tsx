import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getProposalData } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proposal Generator - Store - Admin - Maine CyberTech" };

export default async function AdminStoreProposalsPage() {
  await requireAdminAccess();
  const data = getProposalData();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Proposal Generator" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-proposals" />}
      title="Proposal Generator"
      description={`${data.fields.length} proposal fields configured`}
      actions={
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
        >
          Generate Proposal
        </button>
      }
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Proposal Fields ({data.fields.length})
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {data.fields.map((field) => (
            <div key={field} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-3">
              <p className="text-xs text-slate-300">{field}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-lg border border-amber-600/20 bg-amber-600/5 px-4 py-3 text-xs text-amber-300">
        Generated proposals are marked as drafts and require human review before sending.
      </div>
    </AdminPageShell>
  );
}
