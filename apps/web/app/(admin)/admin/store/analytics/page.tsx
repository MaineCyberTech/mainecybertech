import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import {
  getAnalyticsEventNames,
  getAnalyticsEventShape,
  getPrivacyRules,
} from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics Events - Store - Admin - Maine CyberTech" };

export default async function AdminStoreAnalyticsPage() {
  await requireAdminAccess();
  const eventNames = getAnalyticsEventNames();
  const eventShape = getAnalyticsEventShape();
  const privacyRules = getPrivacyRules();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Analytics Events" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-analytics" />}
      title="Analytics Event Registry"
      description={`${eventNames.length} tracked event types`}
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Event Names ({eventNames.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {eventNames.map((name) => (
            <span
              key={name}
              className="rounded border border-white/10 bg-cyber-base/60 px-3 py-1.5 font-mono text-xs text-slate-300"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Event Shape</h2>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(eventShape).map(([field, type]) => (
              <div key={field} className="flex items-center gap-2">
                <span className="font-mono text-xs text-emerald-400">{field}</span>
                <span className="text-xs text-slate-500">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Privacy Rules</h2>
        <ul className="space-y-1">
          {privacyRules.map((rule, i) => (
            <li
              key={i}
              className="rounded-lg border border-white/10 bg-cyber-base/60 px-4 py-2 text-xs text-slate-400"
            >
              {rule}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Dashboard Cards</h2>
        <div className="flex flex-wrap gap-2">
          <span className="rounded border border-emerald-600/20 bg-emerald-600/10 px-3 py-1.5 text-xs text-emerald-400">
            Top viewed products
          </span>
          <span className="rounded border border-emerald-600/20 bg-emerald-600/10 px-3 py-1.5 text-xs text-emerald-400">
            Quiz completion rate
          </span>
          <span className="rounded border border-emerald-600/20 bg-emerald-600/10 px-3 py-1.5 text-xs text-emerald-400">
            Quote submissions
          </span>
        </div>
      </section>
    </AdminPageShell>
  );
}
