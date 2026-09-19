import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getApiClient } from "@/lib/api";
import type { StoreQuote } from "@mct/sdk";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quote Requests - Store - Admin - Maine CyberTech" };

interface Quote {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  items: { productId?: string; name?: string; priceRange?: string }[];
  notes?: string;
  submittedAt: string;
}

function toQuote(q: StoreQuote): Quote {
  return {
    id: q.id,
    name: q.name,
    email: q.email,
    phone: q.phone,
    status: q.status,
    items: q.items ?? [],
    notes: q.notes || undefined,
    submittedAt: q.created_at,
  };
}

function statusPill(status: string) {
  const lower = status.toLowerCase();
  const map: Record<string, string> = {
    draft: "border-slate-500/25 bg-slate-500/10 text-slate-400",
    submitted: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    reviewing: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    converted_to_project: "border-blue-500/25 bg-blue-500/10 text-blue-400",
    closed: "border-white/10 bg-white/5 text-slate-400",
  };
  return map[lower] ?? "border-white/10 bg-white/5 text-slate-400";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    reviewing: "Reviewing",
    converted_to_project: "Converted",
    closed: "Closed",
  };
  return map[status.toLowerCase()] ?? status;
}

export default async function AdminStoreQuotesPage() {
  await requireAdminAccess();

  let quotes: Quote[] = [];
  try {
    quotes = (await getApiClient().store.listQuotes()).map(toQuote);
  } catch {
    // API unavailable — show empty
  }

  const statuses = ["submitted", "reviewing", "converted_to_project", "closed", "draft"] as const;

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Quote Requests" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-quotes" />}
      title="Quote Requests"
      description={`${quotes.length} request${quotes.length === 1 ? "" : "s"} received`}
    >
      {quotes.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-8 text-center text-sm text-slate-400">
          No quote requests yet.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-white/10 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-cyber-base/60">
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Items</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-white/5 transition hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium text-slate-50">{q.name}</td>
                    <td className="px-4 py-3 text-slate-300">{q.email}</td>
                    <td className="px-4 py-3 text-slate-300">{q.phone}</td>
                    <td className="px-4 py-3 text-slate-400">{q.items.length}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusPill(q.status)}`}
                      >
                        {statusLabel(q.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {new Date(q.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {quotes.map((q) => (
              <div key={q.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-50">{q.name}</p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusPill(q.status)}`}
                  >
                    {statusLabel(q.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{q.email}</p>
                <p className="text-xs text-slate-400">{q.phone}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    {q.items.length} item{q.items.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>{new Date(q.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Status legend */}
      <div className="mt-8 flex flex-wrap gap-4 text-xs text-slate-500">
        {statuses.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${statusPill(s).includes("border-emerald") ? "bg-emerald-400" : statusPill(s).includes("border-amber") ? "bg-amber-400" : statusPill(s).includes("border-blue") ? "bg-blue-400" : "bg-slate-400"}`}
            />
            {statusLabel(s)}
          </span>
        ))}
      </div>
    </AdminPageShell>
  );
}
