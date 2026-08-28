import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Change Advisory Board - Portal - Maine CyberTech" };

export default async function PortalCabPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;

  let meetings: Array<Record<string, unknown>> = [];
  let pendingChanges: Array<Record<string, unknown>> = [];
  try {
    const r = await api.cab.list({ organizationId: orgId });
    meetings = r.items as unknown as typeof meetings;
  } catch {}
  try {
    const cr = await api.governance.changes.list({ organizationId: orgId, status: "pending" });
    pendingChanges = (cr.items as unknown as Array<Record<string, unknown>>).filter(
      (c) => String(c.status) === "pending",
    );
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Change Advisory Board">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Change Advisory Board" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Change Advisory Board</h1>
      <p className="text-sm text-slate-400">
        {meetings.length} CAB meeting{meetings.length !== 1 ? "s" : ""} scheduled for your
        organization.
      </p>

      <section className="space-y-3" aria-label="CAB Meetings">
        <h2 className="text-lg font-medium text-slate-50">Meetings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {meetings.map((m) => {
            const agenda = Array.isArray(m.agenda) ? (m.agenda as Array<Record<string, unknown>>) : [];
            return (
              <div
                key={String(m.id)}
                className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-50">
                    {m.scheduled_at
                      ? new Date(String(m.scheduled_at)).toISOString().slice(0, 10)
                      : "Unscheduled"}
                  </p>
                  <StatusPill status={String(m.status || "unknown")} />
                </div>
                {m.notes ? (
                  <p className="mt-1 text-xs text-slate-400">{String(m.notes)}</p>
                ) : null}
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  Agenda ({agenda.length})
                </p>
                <ul className="mt-1 space-y-1">
                  {agenda.map((a) => (
                    <li key={String(a.id)} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">
                        Change: {String(a.change_request_id).slice(0, 8)}
                      </span>
                      <StatusPill status={String(a.decision || "pending")} />
                    </li>
                  ))}
                  {agenda.length === 0 && (
                    <li className="text-xs text-slate-500">No agenda items.</li>
                  )}
                </ul>
              </div>
            );
          })}
          {meetings.length === 0 && (
            <p className="col-span-2 text-sm text-slate-400">No CAB meetings scheduled.</p>
          )}
        </div>
      </section>

      <section className="space-y-3" aria-label="Pending Change Requests">
        <h2 className="text-lg font-medium text-slate-50">Pending Change Requests (add to a meeting)</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {pendingChanges.map((c) => (
            <div
              key={String(c.id)}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-50">{String(c.title || c.name || "")}</p>
                <StatusPill status={String(c.status || "unknown")} />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Priority: {String(c.priority || "N/A")} &bull; Type: {String(c.change_type || "N/A")}
              </p>
            </div>
          ))}
          {pendingChanges.length === 0 && (
            <p className="col-span-2 text-sm text-slate-400">No pending change requests.</p>
          )}
        </div>
      </section>

      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
