import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getPromotions, validatePromotion } from "@/lib/catalog/promotions";
import PromoForm from "./PromoForm";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promotions - Store - Admin - Maine CyberTech" };

const promoTypeLabels: Record<string, string> = {
  bundle_savings: "Bundle Savings",
  starter_credit: "Starter Credit",
  seasonal_offer: "Seasonal Offer",
  new_client_foundation: "New Client Foundation",
  limited_capacity: "Limited Capacity",
  free_addon: "Free Add-on",
};

function statusPill(status: string) {
  const styles: Record<string, string> = {
    active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    paused: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    expired: "border-slate-500/25 bg-slate-500/10 text-slate-400",
    archived: "border-red-500/25 bg-red-500/10 text-red-400",
  };
  return styles[status] ?? "border-white/10 bg-white/5 text-slate-400";
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminPromotionsPage() {
  await requireAdminAccess();

  const promotions = getPromotions();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Promotions" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-promotions" />}
      title="Promotions"
      description={`${promotions.length} promotion${promotions.length === 1 ? "" : "s"} configured`}
      actions={
        <PromoForm mode="create">
          <button type="submit" className="cyber-button">
            Create Promotion
          </button>
        </PromoForm>
      }
    >
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-white/10 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-[#0A1118]/60">
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Badge</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Eligibility</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Dates</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => {
              const result = validatePromotion(p);
              const errors = result.errors;
              return (
                <tr key={p.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-50">{p.name}</p>
                      {errors.length > 0 && (
                        <p className="mt-0.5 text-[10px] text-amber-400">⚠ {errors.join("; ")}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-300">{p.badgeText || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {promoTypeLabels[p.promoType] || p.promoType}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusPill(p.status)}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {p.eligibilityTargets.length === 1 && p.eligibilityTargets[0] === "all"
                      ? "All products"
                      : `${p.eligibilityTargets.length} target${p.eligibilityTargets.length === 1 ? "" : "s"}`}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    <div>{formatDate(p.startDate)}</div>
                    <div className="text-slate-600">→ {formatDate(p.endDate)}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <PromoForm mode="edit" promotion={p}>
                        <button
                          type="submit"
                          className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
                        >
                          Edit
                        </button>
                      </PromoForm>
                      <DeleteButton id={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {promotions.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">
            No promotions yet. Click &quot;Create Promotion&quot; to get started.
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {promotions.map((p) => {
          const result = validatePromotion(p);
          return (
            <div key={p.id} className="glass-card block p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-50">{p.name}</p>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusPill(p.status)}`}
                >
                  {p.status}
                </span>
              </div>
              {result.errors.length > 0 && (
                <p className="mt-1 text-[10px] text-amber-400">⚠ {result.errors.join("; ")}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{promoTypeLabels[p.promoType] || p.promoType}</span>
                <span className="text-slate-600">|</span>
                <span>
                  {p.eligibilityTargets.length === 1 && p.eligibilityTargets[0] === "all"
                    ? "All products"
                    : `${p.eligibilityTargets.length} target${p.eligibilityTargets.length === 1 ? "" : "s"}`}
                </span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {formatDate(p.startDate)} → {formatDate(p.endDate)}
              </div>
              {p.badgeText && (
                <div className="mt-2">
                  <span className="inline-block rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                    {p.badgeText}
                  </span>
                </div>
              )}
              <div className="mt-3 flex items-center gap-3">
                <PromoForm mode="edit" promotion={p}>
                  <button
                    type="submit"
                    className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
                  >
                    Edit
                  </button>
                </PromoForm>
                <DeleteButton id={p.id} name={p.name} />
              </div>
            </div>
          );
        })}
        {promotions.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-8 text-center text-sm text-slate-400">
            No promotions yet. Click &quot;Create Promotion&quot; to get started.
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
