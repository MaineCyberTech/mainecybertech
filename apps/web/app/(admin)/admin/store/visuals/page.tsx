import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getVisualServiceMap } from "@/lib/catalog/loader";
import StoreIconTile from "@/components/store/StoreIconTile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Visual Asset Manager - Admin - Maine CyberTech" };

export default async function AdminVisualsPage() {
  await requireAdminAccess();
  const visualMap = getVisualServiceMap();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Visuals" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-visuals" />}
      title="Visual Asset Manager"
      description="Category visual map with icon previews. Edit by updating the JSON data file."
    >
      <div className="mt-6 space-y-6">
        <div className="glass-card rounded-xl border border-white/10 p-6">
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Style Guide
            </span>
            <p className="mt-1 text-sm text-slate-300">{visualMap.style}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/5 bg-white/5 p-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Icon Library
              </span>
              <p className="mt-1 text-sm text-emerald-400">{visualMap.iconLibraryRecommendation}</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/5 p-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Categories
              </span>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                {visualMap.categoryVisuals.length}
              </p>
            </div>
          </div>
        </div>

        <h3 className="font-orbitron text-lg font-bold uppercase tracking-wider text-slate-50">
          Category Visuals
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visualMap.categoryVisuals.map((cv) => (
            <div
              key={cv.category}
              className="glass-card group rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5 transition hover:border-emerald-600/30"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-cyber-base/60">
                  <StoreIconTile iconName={cv.icon} className="h-6 w-6" size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-50">{cv.category}</h4>
                  <span className="font-mono text-[10px] text-slate-500">{cv.icon}</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{cv.imagePrompt}</p>
            </div>
          ))}
        </div>

        <h3 className="font-orbitron mt-8 text-lg font-bold uppercase tracking-wider text-slate-50">
          Asset Rules
        </h3>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <ul className="space-y-2">
            {visualMap.assetRules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                <span className="mt-0.5 text-emerald-500">▸</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-6">
          <h4 className="mb-3 text-sm font-semibold text-slate-400">JSON Preview</h4>
          <pre className="max-h-80 overflow-auto rounded bg-cyber-base p-4 text-xs text-slate-400">
            {JSON.stringify(visualMap, null, 2)}
          </pre>
          <p className="mt-3 text-xs text-slate-500">
            To edit visuals, modify{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-emerald-400">
              lib/catalog/data/visual-service-map.json
            </code>
          </p>
        </div>
      </div>
    </AdminPageShell>
  );
}
