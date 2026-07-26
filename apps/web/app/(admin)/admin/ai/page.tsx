import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Tools - Admin - Maine CyberTech" };

export default async function AiToolsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let drafts: Array<{
    id: string;
    raw_description: string;
    suggested_category: string;
    suggested_priority: string;
    suggested_subject: string;
    confidence_score: number;
    status: string;
    created_at: string;
  }> = [];

  try {
    const r = await api.ai.triageList({});
    drafts = r.items as typeof drafts;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "AI Tools" }]} />
      }
      subnav={<AdminSubnav current="ai" />}
      title="AI Service Desk Tools"
      description="Ticket triage assistant and service desk copilot for drafting replies and summarizing tickets."
      actions={
        <Link href="/admin/ai/triage" className="cyber-button">
          New Triage
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Ticket Triage</h2>
          <p className="mt-2 text-sm text-slate-400">
            Transform vague client descriptions into structured tickets with suggested category,
            priority, and missing information.
          </p>
          <div className="mt-4">
            <Link href="/admin/ai/triage" className="cyber-button">
              Open Triage
            </Link>
          </div>
        </section>
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Copilot Console</h2>
          <p className="mt-2 text-sm text-slate-400">
            Summarize tickets and draft reply suggestions for service desk operators.
          </p>
          <div className="mt-4">
            <Link href="/admin/tickets" className="cyber-button">
              Open Tickets
            </Link>
          </div>
        </section>
      </div>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Recent Triage Drafts</h2>
        <div className="mt-6 space-y-3">
          {drafts.length > 0 ? (
            drafts.slice(0, 10).map((d) => (
              <div key={d.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="line-clamp-2 text-sm text-slate-300">{d.raw_description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {d.suggested_category} &bull; {d.suggested_priority} &bull; Score:{" "}
                      {d.confidence_score}%
                    </p>
                  </div>
                  <span
                    className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${d.status === "converted" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-300"}`}
                  >
                    {d.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🤖"
              title="No triage drafts yet"
              description="Start triaging client descriptions into structured tickets."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
