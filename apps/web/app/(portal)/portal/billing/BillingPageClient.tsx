"use client";

import { useState } from "react";
import { getClientApi } from "@/lib/client-api";

type Invoice = {
  id: string;
  invoice_number?: string | null;
  status: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  hosted_invoice_url?: string | null;
  invoice_pdf_url?: string | null;
  due_at?: string | null;
  paid_at?: string | null;
  created_at: string;
};

type Subscription = {
  id: string;
  plan_name: string;
  status: string;
  amount_cents?: number | null;
  currency?: string | null;
  current_period_end?: string | null;
  created_at: string;
};

type BillingCustomer = {
  id: string;
  billing_email?: string | null;
  default_payment_method?: string | null;
} | null;

type BillingSummary = {
  activeSubscriptions: number;
  overdueInvoices: number;
  paidInvoices: number;
  totalInvoices: number;
} | null;

type Props = {
  summary: BillingSummary;
  subscriptions: Subscription[];
  invoices: Invoice[];
  customer: BillingCustomer;
};

function formatCents(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    paid: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    open: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    overdue: "border-red-500/20 bg-red-500/10 text-red-300",
    draft: "border-white/10 bg-white/5 text-slate-400",
    void: "border-slate-500/20 bg-slate-500/10 text-slate-400",
    uncollectible: "border-red-500/20 bg-red-500/10 text-red-300",
    active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    trialing: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    past_due: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    canceled: "border-slate-500/20 bg-slate-500/10 text-slate-400",
  };
  return colors[status] ?? "border-white/10 bg-white/5 text-slate-400";
}

export default function BillingPageClient({ summary, subscriptions, invoices, customer }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await getClientApi().billing.syncFromStripe();
      setSyncMsg(`Synced ${result.synced} customer(s). Refresh to see changes.`);
    } catch {
      setSyncMsg("Sync error.");
    }
    setSyncing(false);
  }

  const activeSub = subscriptions.find((s) => s.status === "active" || s.status === "trialing");

  return (
    <div className="space-y-6">
      {syncMsg ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{syncMsg}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-slate-50">{summary?.activeSubscriptions ?? 0}</p>
          <p className="text-xs text-slate-500">Active Plans</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className={`text-2xl font-bold ${(summary?.overdueInvoices ?? 0) > 0 ? "text-red-400" : "text-slate-50"}`}>
            {summary?.overdueInvoices ?? 0}
          </p>
          <p className="text-xs text-slate-500">Overdue</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-slate-50">{summary?.paidInvoices ?? 0}</p>
          <p className="text-xs text-slate-500">Paid</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <p className="text-2xl font-bold text-slate-50">{summary?.totalInvoices ?? 0}</p>
          <p className="text-xs text-slate-500">Total Invoices</p>
        </div>
      </div>

      {activeSub ? (
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Active Plan</h2>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-bold text-slate-50">{activeSub.plan_name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {formatCents(activeSub.amount_cents ?? 0, activeSub.currency ?? "usd")}/mo
                &middot; Next billing {formatDate(activeSub.current_period_end)}
              </p>
            </div>
            <span className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider ${statusColor(activeSub.status)}`}>
              {activeSub.status}
            </span>
          </div>
        </section>
      ) : null}

      {customer ? (
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Billing Details</h2>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            {customer.billing_email ? (
              <div><span className="text-slate-500">Billing Email:</span> <span className="ml-2 text-slate-200">{customer.billing_email}</span></div>
            ) : null}
            {customer.default_payment_method ? (
              <div><span className="text-slate-500">Payment Method:</span> <span className="ml-2 text-slate-200">{customer.default_payment_method}</span></div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="cyber-panel">
        <div className="flex items-center justify-between">
          <h2 className="cyber-heading text-lg">Invoices</h2>
          <button onClick={handleSync} disabled={syncing}
            className="cyber-button-secondary text-xs">
            {syncing ? "Syncing..." : "Sync from Stripe"}
          </button>
        </div>
        <div className="mt-6 overflow-x-auto">
          {invoices.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">No invoices yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Invoice</th>
                  <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Date</th>
                  <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Amount</th>
                  <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Status</th>
                  <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Download</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-3 py-3 font-medium text-slate-200">{inv.invoice_number ?? inv.id.slice(0, 8)}</td>
                    <td className="px-3 py-3 text-slate-400">{formatDate(inv.created_at)}</td>
                    <td className="px-3 py-3 text-slate-200">{formatCents(inv.total_cents, inv.currency)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {inv.invoice_pdf_url ? (
                        <a href={inv.invoice_pdf_url} target="_blank" rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 text-xs">PDF</a>
                      ) : inv.hosted_invoice_url ? (
                        <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 text-xs">View</a>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {subscriptions.length > 1 ? (
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Subscription History</h2>
          <div className="mt-6 space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div>
                  <p className="font-medium text-slate-200">{sub.plan_name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatCents(sub.amount_cents ?? 0, sub.currency ?? "usd")}/mo</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusColor(sub.status)}`}>
                    {sub.status}
                  </span>
                  <span className="text-xs text-slate-500">{formatDate(sub.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
