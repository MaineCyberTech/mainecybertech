"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

export default function SatisfactionPulseCreateForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const api = getClientApi();
        await api.satisfactionPulse.create({
          organizationId: String(fd.get("organizationId") || ""),
          subject: String(fd.get("subject") || ""),
          question: String(fd.get("question") || "") || null,
          rating: Number(fd.get("rating") || 5),
          source: String(fd.get("source") || "ticket"),
          sendAt: String(fd.get("sendAt") || "") || null,
        });
        setSaved(true);
      } catch {
        setError("Failed to create pulse survey.");
      }
    });
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <h3 className="text-sm font-medium text-slate-50">New Pulse Survey</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-xs text-slate-400">
          Org ID
          <input
            name="organizationId"
            required
            placeholder="Org UUID"
            className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="text-xs text-slate-400">
          Subject
          <input
            name="subject"
            required
            placeholder="How did your support experience go?"
            className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="text-xs text-slate-400">
          Question
          <input
            name="question"
            placeholder="Optional question text"
            className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="text-xs text-slate-400">
          Source
          <select
            name="source"
            className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          >
            {["ticket", "project", "qbr", "onboarding", "follow_up"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Default rating
          <input
            name="rating"
            type="number"
            min={0}
            max={10}
            defaultValue={5}
            className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="text-xs text-slate-400">
          Send at (ISO date)
          <input
            name="sendAt"
            type="datetime-local"
            className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create Pulse"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Pulse created.</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}
