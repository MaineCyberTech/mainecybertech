import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import { StatusPill } from "@/components/admin/StatusPill";
import { SeverityPill } from "@/components/admin/SeverityPill";
import Link from "next/link";
import CrudForm from "@/components/admin/CrudForm";
import AdminPagination from "@/components/admin/AdminPagination";
import { createFinding } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Findings - Admin - Maine CyberTech" };

const DEFAULT_LIMIT = 25;

type FindingsPageProps = {
  searchParams?: Promise<{ page?: string; limit?: string }>;
};

export default async function FindingsPage({ searchParams }: FindingsPageProps) {
  await requireAdminAccess();
  const api = getApiClient();

  const sp = (await searchParams) ?? {};
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));

  let findings: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    source: string;
    remediation_deadline: string | null;
    created_at: string;
  }> = [];
  let stats = {
    bySeverity: { p0: 0, p1: 0, p2: 0, p3: 0 },
    byStatus: {} as Record<string, number>,
    total: 0,
  };
  let total = 0;

  try {
    const [result, statsResult] = await Promise.allSettled([
      api.findings.list({ page, limit }),
      api.findings.stats({}),
    ]);
    if (result.status === "fulfilled") {
      findings = result.value.items as typeof findings;
      total = result.value.total ?? 0;
    }
    if (statsResult.status === "fulfilled") stats = statsResult.value;
  } catch {
    // Gracefully degrade
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Findings" }]} />
      }
      subnav={<AdminSubnav current="findings" />}
      title="Open Findings & Remediation Tracker"
      description="P0/P1/P2/P3 finding lifecycle for security, network, SOP, and client assessments."
      actions={
        <div className="flex flex-wrap gap-2">
          <div className="cyber-pill">P0: {stats.bySeverity.p0}</div>
          <div className="cyber-pill">P1: {stats.bySeverity.p1}</div>
          <div className="cyber-pill">P2: {stats.bySeverity.p2}</div>
          <div className="cyber-pill">P3: {stats.bySeverity.p3}</div>
        </div>
      }
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "title", label: "Title", required: true },
          {
            key: "severity",
            label: "Severity",
            type: "select",
            options: ["p0", "p1", "p2", "p3"],
            required: true,
          },
          { key: "source", label: "Source", required: true },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        title="New Finding"
        action={createFinding}
      />
      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Findings ({stats.total})</h2>
        </div>
        <div className="mt-6 space-y-3">
          {findings.length > 0 ? (
            findings.map((f) => (
              <Link
                key={f.id}
                href={`/admin/findings/${f.id}`}
                className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{f.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {f.source} &bull; Created {new Date(f.created_at).toISOString().slice(0, 10)}
                      {f.remediation_deadline
                        ? ` &bull; Due ${new Date(f.remediation_deadline).toISOString().slice(0, 10)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityPill severity={f.severity} />
                    <StatusPill status={f.status} />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="🔍"
              title="No findings yet"
              description="Record your first security or compliance finding."
            />
          )}
        </div>
      </section>

      <AdminPagination
        currentPage={page}
        totalPages={Math.ceil(total / limit)}
        buildHref={(p) => `/admin/findings?page=${p}&limit=${limit}`}
        total={total}
        limit={limit}
      />
    </AdminPageShell>
  );
}
