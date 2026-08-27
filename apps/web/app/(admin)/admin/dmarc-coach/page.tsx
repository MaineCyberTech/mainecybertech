import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import AdminPagination from "@/components/admin/AdminPagination";
import DmarcAnalyzeForm from "./DmarcAnalyzeForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "DMARC Coach - Admin - Maine CyberTech" };

const DEFAULT_LIMIT = 25;

type DmarcCoachPageProps = {
  searchParams?: Promise<{ page?: string; limit?: string }>;
};

function GradePill({ grade }: { grade: string }) {
  const colorMap: Record<string, string> = {
    A: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    "A+": "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    "A-": "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    B: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    "B+": "border-amber-500/25 bg-amber-500/10 text-amber-300",
    "B-": "border-amber-500/25 bg-amber-500/10 text-amber-300",
    C: "border-red-500/25 bg-red-500/10 text-red-300",
    D: "border-red-500/25 bg-red-500/10 text-red-300",
    F: "border-red-500/25 bg-red-500/10 text-red-300",
  };
  const colors = colorMap[grade.toUpperCase()] || "border-white/10 bg-white/5 text-slate-300";
  return (
    <span
      className={`inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] ${colors}`}
    >
      {grade}
    </span>
  );
}

export default async function DmarcCoachPage({ searchParams }: DmarcCoachPageProps = {}) {
  await requireAdminAccess();
  const api = getApiClient();

  const sp = (await searchParams) ?? {};
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));

  let items = [] as Array<{
    id: string;
    domain: string;
    overall_grade: string;
    dmarc_record: string | null;
    created_at: string;
  }>;
  let total = 0;

  try {
    const r = (await api.dmarcCoach.list({ page, limit })) as any;
    items = r.items as typeof items;
    total = r.total ?? 0;
  } catch (e) {
    console.error("DMARC Coach: failed to load data", e);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "DMARC Coach" }]} />
      }
      subnav={<AdminSubnav current="dmarc-coach" />}
      title="DMARC Coach"
      description="Analyze DMARC, SPF, and DKIM records with automated grading and remediation recommendations."
      actions={null}
    >
      <DmarcAnalyzeForm />
      <section className="cyber-panel mt-6">
        <h2 className="cyber-heading text-lg">Analyzed Domains</h2>
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{item.domain}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.dmarc_record
                        ? `DMARC: ${item.dmarc_record.slice(0, 80)}${item.dmarc_record.length > 80 ? "..." : ""}`
                        : "No DMARC record found"}{" "}
                      &bull; {new Date(item.created_at).toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <GradePill grade={item.overall_grade} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🛡️"
              title="No domains analyzed yet"
              description="Run your first DMARC analysis to grade email security posture and get remediation recommendations."
              actionHref="/admin/dmarc-coach"
              actionLabel="Refresh"
            />
          )}
        </div>
      </section>

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        buildHref={(p) => `/admin/dmarc-coach?page=${p}&limit=${limit}`}
        total={total}
        limit={limit}
      />
    </AdminPageShell>
  );
}
