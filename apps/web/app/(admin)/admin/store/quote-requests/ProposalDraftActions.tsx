"use client";

import { useState } from "react";
import { generateProposalDraftAction, updateProposalDraftStatusAction } from "./actions";

export function GenerateProposalDraftButton({ quoteRequestId }: { quoteRequestId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setPending(true);
    setError("");
    const formData = new FormData();
    formData.set("quoteRequestId", quoteRequestId);
    const result = await generateProposalDraftAction(formData);
    if (!result.ok) setError(result.error ?? "Failed to generate the proposal draft.");
    setPending(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded border border-emerald-600/40 bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-600/20 disabled:opacity-50"
      >
        {pending ? "Generating…" : "Generate proposal draft"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-amber-400">
          {error}
        </p>
      )}
    </div>
  );
}

const STATUSES = ["draft_internal", "in_review", "approved", "sent", "archived"] as const;

export function ProposalDraftStatusForm({ draftId, status }: { draftId: string; status: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [value, setValue] = useState(status);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData();
    formData.set("draftId", draftId);
    formData.set("status", value);
    const result = await updateProposalDraftStatusAction(formData);
    if (!result.ok) setError(result.error ?? "Failed to update the draft.");
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        aria-label="Proposal draft status"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded border border-white/10 bg-cyber-base/60 px-2 py-1 text-xs text-slate-200"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-white/10 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-amber-400">
          {error}
        </span>
      )}
    </form>
  );
}
