import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getTrustBadges } from "@/lib/catalog/loader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trust Badges - Store - Admin - Maine CyberTech" };

export default async function AdminStoreTrustBadgesPage() {
  await requireAdminAccess();
  const data = getTrustBadges();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Trust Badges" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-trust-badges" />}
      title="Trust Badge Configuration"
      description={`${data.badges.length} badge definitions, ${data.placementRules.length} placement rules`}
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Badge Definitions ({data.badges.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.badges.map((badge) => (
            <div key={badge.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500" aria-hidden="true">
                  ✦
                </span>
                <p className="text-sm font-medium text-slate-50">{badge.label}</p>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-500">{badge.id}</p>
              <p className="mt-2 text-xs text-slate-400">{badge.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Placement Rules ({data.placementRules.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.placementRules.map((rule) => (
            <div
              key={rule.surface}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <p className="mb-1 text-sm font-medium text-slate-50">{rule.surface}</p>
              {rule.maxBadges !== undefined && (
                <p className="text-xs text-slate-400">
                  Max: {rule.maxBadges} badge{rule.maxBadges !== 1 ? "s" : ""}
                </p>
              )}
              {rule.requiredBadges && rule.requiredBadges.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] text-slate-500">Required:</p>
                  {rule.requiredBadges.map((id) => (
                    <span
                      key={id}
                      className="inline-block rounded bg-emerald-600/10 px-2 py-0.5 text-[11px] text-emerald-400"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
