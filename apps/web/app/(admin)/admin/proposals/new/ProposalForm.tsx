"use client";

import { useState, useTransition } from "react";
import { createProposalAction } from "../actions";

export default function ProposalForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    startTransition(async () => {
      const result = await createProposalAction(fd);
      if (result && !result.ok) setError(result.error ?? "Failed to create proposal");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="cyber-panel space-y-4">
      <div>
        <label htmlFor="p-title" className="mb-1 block text-xs font-medium text-slate-400">
          Title *
        </label>
        <input
          id="p-title"
          name="title"
          required
          placeholder="e.g. Q4 Managed Services Proposal"
          className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="p-org" className="mb-1 block text-xs font-medium text-slate-400">
          Organization ID *
        </label>
        <input
          id="p-org"
          name="organizationId"
          required
          placeholder="Org UUID"
          className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="p-desc" className="mb-1 block text-xs font-medium text-slate-400">
          Description
        </label>
        <textarea
          id="p-desc"
          name="description"
          rows={3}
          className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-valid" className="mb-1 block text-xs font-medium text-slate-400">
            Valid Until
          </label>
          <input
            id="p-valid"
            name="validUntil"
            type="date"
            className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="p-vis" className="mb-1 block text-xs font-medium text-slate-400">
            Visibility
          </label>
          <select
            id="p-vis"
            name="visibility"
            className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="internal">Internal</option>
            <option value="client_visible">Client Visible</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create Proposal"}
      </button>
    </form>
  );
}
