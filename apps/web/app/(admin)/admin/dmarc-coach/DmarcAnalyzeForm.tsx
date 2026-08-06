"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

export default function DmarcAnalyzeForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const api = getClientApi();
        const res = (await api.dmarcCoach.analyze({
          organizationId: String(fd.get("organizationId") || ""),
          domain: String(fd.get("domain") || ""),
          dmarcRecord: String(fd.get("dmarcRecord") || "") || null,
          spfRecord: String(fd.get("spfRecord") || "") || null,
          dkimRecord: String(fd.get("dkimRecord") || "") || null,
        })) as Record<string, unknown>;
        setResult(res);
      } catch {
        setError("Analysis failed. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
      <h3 className="text-sm font-medium text-slate-50">Run DMARC Analysis</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-xs text-slate-400">
          Org ID
          <input
            name="organizationId"
            required
            placeholder="Org UUID"
            className="mt-1 w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="text-xs text-slate-400">
          Domain
          <input
            name="domain"
            required
            placeholder="example.com"
            className="mt-1 w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="text-xs text-slate-400">
          DMARC record
          <input
            name="dmarcRecord"
            placeholder="v=DMARC1; p=none; rua=mailto:..."
            className="mt-1 w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="text-xs text-slate-400">
          SPF record
          <input
            name="spfRecord"
            placeholder="v=spf1 include:_spf.example.com ~all"
            className="mt-1 w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="text-xs text-slate-400">
          DKIM record
          <input
            name="dkimRecord"
            placeholder="v=DKIM1; k=rsa; p=..."
            className="mt-1 w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? "Analyzing…" : "Analyze"}
        </button>
        {result && (
          <span className="text-sm text-emerald-400">
            Grade: {String((result as Record<string, unknown>).overall_grade ?? "—")}
          </span>
        )}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}
