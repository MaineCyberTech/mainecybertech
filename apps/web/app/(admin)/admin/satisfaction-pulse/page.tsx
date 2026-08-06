import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import SatisfactionPulseCreateForm from "./SatisfactionPulseCreateForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Satisfaction Pulse - Admin" };

export default async function SatisfactionPulseAdminPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<Record<string, unknown>> = [];
  let templates: Array<Record<string, unknown>> = [];
  let schedules: Array<Record<string, unknown>> = [];
  try {
    const r = await api.satisfactionPulse.list({ limit: 100, page: 1 });
    items = r.items as unknown as typeof items;
  } catch {}
  try {
    templates = (await api.satisfactionPulse.listTemplates()) as unknown as typeof templates;
  } catch {}
  try {
    schedules = (await api.satisfactionPulse.listSchedules()) as unknown as typeof schedules;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[{ label: "Admin", href: "/admin" }, { label: "Satisfaction Pulse" }]}
        />
      }
      subnav={<AdminSubnav current="satisfaction-pulse" />}
      title="Client Satisfaction Pulse"
      description="CSAT/NPS pulse surveys tied to tickets, projects, QBRs, onboarding milestones, and follow-ups."
      actions={null}
    >
      <SatisfactionPulseCreateForm />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="cyber-panel lg:col-span-2">
          <h2 className="cyber-heading text-lg">Pulses</h2>
          <div className="mt-4 space-y-3">
            {items.length > 0 ? (
              items.map((p) => (
                <div
                  key={String(p.id)}
                  className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
                >
                  <Link
                    className="transition hover:text-emerald-400"
                    href={`/admin/satisfaction-pulse/${p.id}`}
                  >
                    <p className="font-medium text-slate-50">{String(p.subject)}</p>
                  </Link>
                  <p className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      {String(p.source || "ticket")}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      {String(p.status || "draft")}
                    </span>
                    {typeof p.rating === "number" && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5">
                        Rating: {p.rating}
                      </span>
                    )}
                    {p.sent_at != null && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5">Sent</span>
                    )}
                    {p.responded_at != null && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5">
                        Responded
                      </span>
                    )}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                icon="😊"
                title="No pulses"
                description="Create a pulse survey to capture client satisfaction."
              />
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Templates ({templates.length})</h2>
            <div className="mt-3 space-y-2">
              {templates.length > 0 ? (
                templates.map((t) => (
                  <div
                    key={String(t.id)}
                    className="rounded-lg border border-white/5 bg-[#0A1118]/60 p-3 text-sm"
                  >
                    <span className="text-slate-50">{String(t.name)}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {t.is_active ? "active" : "inactive"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No templates yet.</p>
              )}
            </div>
          </section>

          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Schedules ({schedules.length})</h2>
            <div className="mt-3 space-y-2">
              {schedules.length > 0 ? (
                schedules.map((s) => (
                  <div
                    key={String(s.id)}
                    className="rounded-lg border border-white/5 bg-[#0A1118]/60 p-3 text-sm"
                  >
                    <span className="text-slate-50">{String(s.name)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No schedules yet.</p>
              )}
            </div>
          </section>

          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Export</h2>
            <p className="mt-2 text-sm text-slate-400">Download pulse responses as CSV.</p>
            <a
              href="/api/v1/satisfaction-pulse/export.csv"
              className="mt-3 inline-block rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Export CSV
            </a>
          </section>
        </div>
      </div>
    </AdminPageShell>
  );
}
