import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getCaseStudies } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Case Studies - Store - Admin - Maine CyberTech" };

export default async function AdminStoreCaseStudiesPage() {
  await requireAdminAccess();
  const caseStudies = getCaseStudies();

  const approved = caseStudies.filter((cs) => cs.approved);
  const pending = caseStudies.filter((cs) => !cs.approved);

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Case Studies" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-case-studies" />}
      title="Case Study Management"
      description={`${caseStudies.length} total, ${approved.length} approved, ${pending.length} pending`}
      actions={
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
        >
          Generate Case Study
        </button>
      }
    >
      {caseStudies.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-6 text-center text-sm text-slate-400">
          No case studies yet. Click "Generate Case Study" to create a new one.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {caseStudies.map((cs) => (
            <div key={cs.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-50">{cs.title}</p>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    cs.approved
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/25 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {cs.approved ? "Approved" : "Draft"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{cs.summary}</p>
              <p className="mt-2 font-mono text-[11px] text-slate-600">/{cs.slug}</p>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
