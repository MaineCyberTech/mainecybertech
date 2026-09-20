import { getApiClient } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = { title: "System Status - Maine CyberTech" };

type Props = { params: Promise<{ orgId: string }> };

type Component = { id: string; name: string; status: string; description?: string | null };
type Incident = {
  id: string;
  title: string;
  status: string;
  impact?: string | null;
  started_at: string;
};
type Maintenance = {
  id: string;
  title: string;
  scheduled_start: string;
  scheduled_end?: string | null;
};

type StatusPayload = {
  components?: Component[];
  activeIncidents?: Incident[];
  upcomingMaintenance?: Maintenance[];
};

const STATUS_STYLES: Record<string, string> = {
  operational: "bg-emerald-600/15 text-emerald-400 border-emerald-600/30",
  degraded: "bg-amber-600/15 text-amber-400 border-amber-600/30",
  partial_outage: "bg-amber-600/15 text-amber-400 border-amber-600/30",
  major_outage: "bg-red-600/15 text-red-400 border-red-600/30",
  maintenance: "bg-sky-600/15 text-sky-400 border-sky-600/30",
};

function statusClass(status: string): string {
  return STATUS_STYLES[status] ?? "bg-white/5 text-slate-300 border-white/10";
}

export default async function PublicStatusPage({ params }: Props) {
  const { orgId } = await params;

  let payload: StatusPayload = {};
  try {
    payload = (await getApiClient().statusPage.publicStatus(orgId)) as StatusPayload;
  } catch {
    payload = {};
  }

  const components = payload.components ?? [];
  const incidents = payload.activeIncidents ?? [];
  const maintenance = payload.upcomingMaintenance ?? [];
  const allOperational =
    incidents.length === 0 && components.every((c) => c.status === "operational");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl uppercase tracking-[0.12em] text-slate-50">
        System Status
      </h1>
      <p
        className={`mt-4 inline-block rounded-lg border px-4 py-2 text-sm font-medium ${
          allOperational
            ? "border-emerald-600/30 bg-emerald-600/15 text-emerald-400"
            : "border-amber-600/30 bg-amber-600/15 text-amber-300"
        }`}
      >
        {allOperational ? "All systems operational" : "Active incidents or degraded services"}
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Components
        </h2>
        {components.length ? (
          <ul className="mt-3 divide-y divide-white/5 rounded-lg border border-white/10">
            {components.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm text-slate-200">{c.name}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusClass(c.status)}`}
                >
                  {c.status.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No components reported.</p>
        )}
      </section>

      {incidents.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Active Incidents
          </h2>
          <ul className="mt-3 space-y-3">
            {incidents.map((i) => (
              <li key={i.id} className="rounded-lg border border-amber-600/20 bg-amber-600/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-100">{i.title}</span>
                  <span className="text-xs text-amber-300">{i.status.replace(/_/g, " ")}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Started {new Date(i.started_at).toLocaleString("en-US", { timeZone: "UTC" })} UTC
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {maintenance.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Scheduled Maintenance
          </h2>
          <ul className="mt-3 space-y-3">
            {maintenance.map((m) => (
              <li key={m.id} className="rounded-lg border border-sky-600/20 bg-sky-600/5 p-4">
                <span className="font-medium text-slate-100">{m.title}</span>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(m.scheduled_start).toLocaleString("en-US", { timeZone: "UTC" })} UTC
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
