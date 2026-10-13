import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DataErrorNote from "@/components/admin/DataErrorNote";
import EmptyState from "@/components/EmptyState";
import {
  getAnalyticsEventNames,
  getAnalyticsEventShape,
  getPrivacyRules,
} from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store Analytics - Admin - Maine CyberTech" };

type SummaryRow = { event: string; count: number };
type EventRow = Record<string, unknown>;

export default async function AdminStoreAnalyticsPage() {
  await requireAdminAccess();
  const eventNames = getAnalyticsEventNames();
  const eventShape = getAnalyticsEventShape();
  const privacyRules = getPrivacyRules();

  // FEAT-P2-003: consume the live endpoints instead of only the static
  // registry. summary() calls GET /analytics/summary (get_analytics_summary
  // RPC); list() returns the most recent 500 events.
  const api = getApiClient();
  let summary: SummaryRow[] = [];
  let events: EventRow[] = [];
  let loadFailed = false;
  try {
    summary = (await api.analytics.summary()) as SummaryRow[];
  } catch (error) {
    console.error("[admin/store/analytics]", error);
    loadFailed = true;
  }
  try {
    events = (await api.analytics.list()) as EventRow[];
  } catch (error) {
    console.error("[admin/store/analytics]", error);
    loadFailed = true;
  }

  const total = summary.reduce((sum, row) => sum + (Number(row.count) || 0), 0);
  const recent = events.slice(0, 10);

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Analytics" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-analytics" />}
      title="Store Analytics"
      description={`${eventNames.length} tracked event types · ${total} events captured`}
    >
      {loadFailed && <DataErrorNote what="store analytics" />}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Live Summary ({summary.length})
        </h2>
        {summary.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-white/10 bg-cyber-base/60">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-2 font-semibold">Event</th>
                  <th className="px-4 py-2 font-semibold">Count</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.event} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-slate-300">{row.event}</td>
                    <td className="px-4 py-2 text-slate-200">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loadFailed && (
            <EmptyState
              icon="📊"
              title="No events captured yet"
              description="Storefront views will appear here once visitors browse the store."
            />
          )
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Recent Events ({events.length})
        </h2>
        {recent.length > 0 ? (
          <ul className="space-y-2">
            {recent.map((row) => (
              <li
                key={String(row.id)}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-cyber-base/60 px-4 py-2 text-xs"
              >
                <span className="font-mono text-emerald-400">{String(row.event)}</span>
                <span className="text-slate-400">{String(row.page ?? "—")}</span>
                <span className="ml-auto text-slate-500">
                  {row.created_at ? new Date(String(row.created_at)).toLocaleString() : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          !loadFailed && (
            <EmptyState
              icon="🛒"
              title="No recent events"
              description="Events recorded through the storefront tracker appear here."
            />
          )
        )}
      </section>

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

      <section>
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
    </AdminPageShell>
  );
}
