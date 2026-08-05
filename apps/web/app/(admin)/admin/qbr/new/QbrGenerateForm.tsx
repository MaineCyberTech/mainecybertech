"use client";

import { useState, useTransition } from "react";
import { generateQbrAction } from "../actions";

export default function QbrGenerateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    startTransition(async () => {
      const result = await generateQbrAction(fd);
      if (result && !result.ok) setError(result.error ?? "Failed to generate report");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="cyber-panel space-y-4">
      <div>
        <label htmlFor="q-org" className="mb-1 block text-xs font-medium text-slate-400">
          Organization ID *
        </label>
        <input
          id="q-org"
          name="organizationId"
          required
          placeholder="Org UUID"
          className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="q-title" className="mb-1 block text-xs font-medium text-slate-400">
          Title
        </label>
        <input
          id="q-title"
          name="title"
          defaultValue="Quarterly Business Review"
          className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="q-start" className="mb-1 block text-xs font-medium text-slate-400">
            Period Start
          </label>
          <input
            id="q-start"
            name="periodStart"
            type="date"
            className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="q-end" className="mb-1 block text-xs font-medium text-slate-400">
            Period End
          </label>
          <input
            id="q-end"
            name="periodEnd"
            type="date"
            className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="q-vis" className="mb-1 block text-xs font-medium text-slate-400">
          Visibility
        </label>
        <select
          id="q-vis"
          name="visibility"
          className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        >
          <option value="internal">Internal</option>
          <option value="client_visible">Client Visible</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Generating..." : "Generate Report"}
      </button>
    </form>
  );
}
