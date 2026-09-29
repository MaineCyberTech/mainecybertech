import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DataErrorNote from "@/components/admin/DataErrorNote";
import { StatusPill, type StatusTone } from "@/components/admin/StatusPill";
import { getApiClient } from "@/lib/api";
import type { StoreQuote } from "@mct/sdk";
import { formatDateShort } from "@/lib/format";

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

function quoteStatusTone(status: string): StatusTone | undefined {
  switch (status.toLowerCase()) {
    case "converted":
      return "emerald";
    case "closed":
      return "slate";
    default:
      return undefined;
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    new: "New",
    reviewed: "Reviewed",
    contacted: "Contacted",
    converted: "Converted",
    closed: "Closed",
  };
  return map[status.toLowerCase()] ?? status;
}

export default async function AdminStoreQuotesPage() {
  await requireAdminAccess();

  let quotes: Quote[] = [];
  let loadFailed = false;
  try {
    quotes = (await getApiClient().store.listQuotes()).map(toQuote);
  } catch {
    loadFailed = true;
    // API unavailable — show empty
  }

  const statuses = ["new", "reviewed", "contacted", "converted", "closed"] as const;

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
      {loadFailed && <DataErrorNote what="store quotes" />}
      {!loadFailed && quotes.length === 0 ? (
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
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-300">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-300">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-300">
                    Phone
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-300">
                    Items
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-300">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-300">
                    Date
                  </th>
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
                      <StatusPill
                        status={q.status}
                        label={statusLabel(q.status)}
                        tone={quoteStatusTone(q.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {formatDateShort(q.submittedAt)}
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
                  <span className="shrink-0">
                    <StatusPill
                      status={q.status}
                      label={statusLabel(q.status)}
                      tone={quoteStatusTone(q.status)}
                    />
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{q.email}</p>
                <p className="text-xs text-slate-400">{q.phone}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span>
                    {q.items.length} item{q.items.length !== 1 ? "s" : ""}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>{formatDateShort(q.submittedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Status legend */}
      <div className="mt-8 flex flex-wrap gap-3">
        {statuses.map((s) => (
          <StatusPill key={s} status={s} label={statusLabel(s)} tone={quoteStatusTone(s)} />
        ))}
      </div>
    </AdminPageShell>
  );
}
