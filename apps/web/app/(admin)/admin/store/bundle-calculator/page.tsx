import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getBundleSavingsCalculator } from "@/lib/catalog/loader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bundle Savings Calculator - Store - Admin - Maine CyberTech" };

export default async function AdminStoreBundleCalculatorPage() {
  await requireAdminAccess();
  const calc = getBundleSavingsCalculator();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Bundle Calculator" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-bundle-calculator" />}
      title="Bundle Savings Calculator"
      description={`${calc.calculationModes.length} calculation modes, ${calc.exampleBundleValuePanels.length} example panels`}
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Calculation Modes ({calc.calculationModes.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {calc.calculationModes.map((mode) => (
            <div key={mode.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
              <p className="text-sm font-medium text-slate-50">{mode.label}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">{mode.id}</p>
              <p className="mt-2 text-xs text-slate-400">{mode.useWhen}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Display Rules</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(calc.displayRules).map(([mode, rule]) => (
            <div key={mode} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
              <p className="mb-1 text-sm font-medium text-slate-50">{mode}</p>
              <p className="text-xs text-slate-400">{rule}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Example Panels ({calc.exampleBundleValuePanels.length})
        </h2>
        <div className="space-y-3">
          {calc.exampleBundleValuePanels.map((panel) => (
            <div
              key={panel.bundleId}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <p className="mb-1 text-sm font-medium text-slate-50">{panel.bundleId}</p>
              <div className="mb-2 flex gap-2">
                <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                  Mode: {panel.mode}
                </span>
              </div>
              <p className="mb-2 text-xs text-slate-300">{panel.includedValueText}</p>
              {panel.componentProductIds.length > 0 && (
                <div className="mb-2">
                  <p className="mb-1 text-[11px] text-slate-500">Components:</p>
                  <div className="flex flex-wrap gap-1">
                    {panel.componentProductIds.map((id) => (
                      <span
                        key={id}
                        className="rounded bg-emerald-600/10 px-2 py-0.5 text-[11px] text-emerald-400"
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {panel.assumptions.length > 0 && (
                <div className="mb-2 space-y-0.5">
                  {panel.assumptions.map((a, i) => (
                    <p key={i} className="text-[11px] text-slate-500">
                      &bull; {a}
                    </p>
                  ))}
                </div>
              )}
              {panel.disclaimer && (
                <p className="text-[10px] italic text-slate-600">{panel.disclaimer}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Schema Fields</h2>
        <div className="flex flex-wrap gap-1">
          {calc.fields.map((f) => (
            <span
              key={f}
              className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-slate-400"
            >
              {f}
            </span>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
