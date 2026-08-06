"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

type Quote = {
  id: string;
  vendor_name: string;
  product: string;
  quote_amount: number | null;
  competitor_quote: number | null;
  comparison_notes?: string | null;
  selected?: boolean;
  price?: number;
  savings?: number;
  isLowest?: boolean;
};

export default function ProcurementCompareClient({
  items,
}: {
  items: Array<Record<string, unknown>>;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const compare = () => {
    if (selected.size < 2) {
      setError("Select at least 2 quotes to compare.");
      return;
    }
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const api = getClientApi();
        const res = (await api.final.procurement.compare([...selected])) as Record<string, unknown>;
        setResult(res);
      } catch {
        setError("Comparison failed. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
      <h3 className="text-sm font-medium text-slate-50">Compare Quotes</h3>
      <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {items.map((q) => (
          <label
            key={String(q.id)}
            className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm transition ${
              selected.has(String(q.id))
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-white/10 bg-[#0A1118] hover:border-white/20"
            }`}
          >
            <span className="text-slate-50">{String(q.vendor_name ?? "Vendor")}</span>
            <span className="text-xs text-slate-400">
              ${Number(q.quote_amount ?? 0).toLocaleString()}
            </span>
            <input
              type="checkbox"
              checked={selected.has(String(q.id))}
              onChange={() => toggle(String(q.id))}
              className="ml-2 accent-emerald-500"
            />
          </label>
        ))}
      </div>
      {items.length >= 2 && (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={compare}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? "Comparing…" : "Compare Selected"}
          </button>
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>
      )}

      {result && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-4">Vendor</th>
                <th className="py-2 pr-4">Quote</th>
                <th className="py-2 pr-4">Savings</th>
                <th className="py-2">Lowest</th>
              </tr>
            </thead>
            <tbody>
              {((result.quotes as Quote[]) ?? []).map((q) => (
                <tr key={q.id} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-slate-50">{q.vendor_name}</td>
                  <td className="py-2 pr-4 text-slate-300">${(q.price ?? 0).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-slate-300">{q.savings ?? 0}%</td>
                  <td className="py-2 text-emerald-400">{q.isLowest ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-400">
            Lowest: ${(result.lowestPrice as number).toLocaleString()} &bull; Highest: $
            {(result.highestPrice as number).toLocaleString()} &bull; Average: $
            {(result.averagePrice as number).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
