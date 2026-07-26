import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proposals - Admin - Maine CyberTech" };

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function pill(c: "emerald" | "amber" | "blue" | "red" | "slate") {
  const map = {
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    red: "border-red-500/25 bg-red-500/10 text-red-300",
    slate: "border-white/10 bg-white/5 text-slate-300",
  } as const;
  return `inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] leading-none ${map[c]}`;
}

const statusPill = (s: string) => {
  const c =
    s === "approved"
      ? "emerald"
      : s === "sent"
        ? "blue"
        : s === "rejected"
          ? "red"
          : s === "expired"
            ? "slate"
            : "amber";
  return <span className={pill(c)}>{s}</span>;
};

export default async function ProposalsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let proposals = [] as Array<{
    id: string;
    title: string;
    status: string;
    grand_total: number;
    created_at: string;
  }>;
  let draftCount = 0;
  let sentCount = 0;
  let approvedCount = 0;

  try {
    const result = await api.proposals.list({});
    proposals = result.items as typeof proposals;
    draftCount = result.items.filter((p: { status: string }) => p.status === "draft").length;
    sentCount = result.items.filter((p: { status: string }) => p.status === "sent").length;
    approvedCount = result.items.filter((p: { status: string }) => p.status === "approved").length;
  } catch {
    // Gracefully degrade if proposals API is not yet available
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Proposals" }]} />
      }
      subnav={<AdminSubnav current="proposals" />}
      title="Proposal Builder"
      description="Create and manage MSP proposals, pricing, phases, and client approvals."
      actions={
        <div className="flex flex-wrap gap-2">
          <div className="cyber-pill">{draftCount} Draft</div>
          <div className="cyber-pill">{sentCount} Sent</div>
          <div className="cyber-pill">{approvedCount} Approved</div>
        </div>
      }
    >
      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Proposals</h2>
          <Link href="/admin/proposals/new" className="cyber-button">
            New Proposal
          </Link>
        </div>
        <div className="mt-6 space-y-3">
          {proposals.length > 0 ? (
            proposals.map((p) => (
              <Link
                key={p.id}
                href={`/admin/proposals/${p.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{p.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {fmtCurrency(p.grand_total ?? 0)} total &bull; Created{" "}
                      {new Date(p.created_at).toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">{statusPill(p.status)}</div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="📄"
              title="No proposals yet"
              description="Create your first MSP proposal to send to a client."
              actionHref="/admin/proposals/new"
              actionLabel="Create Proposal"
            />
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Quick Actions</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <Link
            href="/admin/organizations"
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-5 transition hover:border-emerald-600/25 hover:bg-[#0A1118]/80"
          >
            <h3 className="font-orbitron text-sm uppercase tracking-[0.12em] text-slate-50">
              Select Client
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              Choose an organization before building a proposal.
            </p>
          </Link>
          <Link
            href="/admin/approvals"
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-5 transition hover:border-emerald-600/25 hover:bg-[#0A1118]/80"
          >
            <h3 className="font-orbitron text-sm uppercase tracking-[0.12em] text-slate-50">
              Approval Queue
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              Track pending client sign-offs for sent proposals.
            </p>
          </Link>
          <Link
            href="/admin/projects"
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-5 transition hover:border-emerald-600/25 hover:bg-[#0A1118]/80"
          >
            <h3 className="font-orbitron text-sm uppercase tracking-[0.12em] text-slate-50">
              Projects
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              Convert approved proposals into active project work.
            </p>
          </Link>
        </div>
      </section>
    </AdminPageShell>
  );
}
