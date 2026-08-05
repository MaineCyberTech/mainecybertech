"use client";

import { useState, useTransition } from "react";
import { updateProposalAction } from "../../actions";

export default function ProposalEditForm({
  proposalId,
  title,
  description,
  status,
  visibility,
  validUntil,
}: {
  proposalId: string;
  title: string;
  description: string;
  status: string;
  visibility: string;
  validUntil: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    startTransition(async () => {
      const result = await updateProposalAction(proposalId, fd);
      if (result.ok) setSaved(true);
      else setError(result.error ?? "Failed to update");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="cyber-panel space-y-4">
      <div>
        <label htmlFor="pe-title" className="mb-1 block text-xs font-medium text-slate-400">
          Title *
        </label>
        <input
          id="pe-title"
          name="title"
          required
          defaultValue={title}
          className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="pe-desc" className="mb-1 block text-xs font-medium text-slate-400">
          Description
        </label>
        <textarea
          id="pe-desc"
          name="description"
          rows={3}
          defaultValue={description}
          className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="pe-status" className="mb-1 block text-xs font-medium text-slate-400">
            Status
          </label>
          <select
            id="pe-status"
            name="status"
            defaultValue={status}
            className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label htmlFor="pe-vis" className="mb-1 block text-xs font-medium text-slate-400">
            Visibility
          </label>
          <select
            id="pe-vis"
            name="visibility"
            defaultValue={visibility}
            className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="internal">Internal</option>
            <option value="client_visible">Client Visible</option>
          </select>
        </div>
        <div>
          <label htmlFor="pe-valid" className="mb-1 block text-xs font-medium text-slate-400">
            Valid Until
          </label>
          <input
            id="pe-valid"
            name="validUntil"
            type="date"
            defaultValue={validUntil}
            className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {saved && <p className="text-sm text-emerald-300">Proposal updated.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
