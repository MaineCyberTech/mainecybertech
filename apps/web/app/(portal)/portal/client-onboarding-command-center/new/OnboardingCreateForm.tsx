"use client";

import { useState, useTransition } from "react";
import { createOnboardingAction } from "../actions";

export default function OnboardingCreateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    startTransition(async () => {
      const result = await createOnboardingAction(fd);
      if (result && !result.ok) setError(result.error ?? "Failed to create");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="cyber-panel space-y-4">
      <div>
        <label htmlFor="oc-name" className="mb-1 block text-xs font-medium text-slate-400">
          Client Name *
        </label>
        <input
          id="oc-name"
          name="clientName"
          required
          placeholder="e.g. New Branch Office"
          className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="oc-domain" className="mb-1 block text-xs font-medium text-slate-400">
            Client Domain
          </label>
          <input
            id="oc-domain"
            name="clientDomain"
            placeholder="branch.example"
            className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="oc-risk" className="mb-1 block text-xs font-medium text-slate-400">
            Risk Level
          </label>
          <select
            id="oc-risk"
            name="riskLevel"
            className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="oc-email" className="mb-1 block text-xs font-medium text-slate-400">
            Contact Email
          </label>
          <input
            id="oc-email"
            name="clientContactEmail"
            type="email"
            className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="oc-phone" className="mb-1 block text-xs font-medium text-slate-400">
            Contact Phone
          </label>
          <input
            id="oc-phone"
            name="clientContactPhone"
            className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="oc-notes" className="mb-1 block text-xs font-medium text-slate-400">
          Discovery Notes
        </label>
        <textarea
          id="oc-notes"
          name="discoveryNotes"
          rows={3}
          className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Start Onboarding"}
      </button>
    </form>
  );
}
