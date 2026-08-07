import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getEmailNurtureData } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email Nurture - Store - Admin - Maine CyberTech" };

export default async function AdminStoreNurturePage() {
  await requireAdminAccess();
  const data = getEmailNurtureData();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Email Nurture" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-nurture" />}
      title="Email Nurture Sequences"
      description={`${data.sequences.length} nurture sequence${data.sequences.length === 1 ? "" : "s"} defined`}
      actions={
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
        >
          Create Nurture Sequence
        </button>
      }
    >
      <section className="mb-8 space-y-4">
        {data.sequences.map((seq) => (
          <div key={seq.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {seq.name}
              </span>
              {seq.interestArea && (
                <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
                  {seq.interestArea}
                </span>
              )}
              {seq.funnelStage && (
                <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-slate-400">
                  {seq.funnelStage}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {seq.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] text-slate-500">
                    {i + 1}
                  </span>
                  <span className="text-slate-300">{step.subject}</span>
                  <span className="text-slate-600">({step.delayDays}d)</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </AdminPageShell>
  );
}
