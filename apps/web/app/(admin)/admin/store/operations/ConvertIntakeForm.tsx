"use client";

import { useState } from "react";
import { convertIntakeToProject } from "@/lib/catalog/intake-actions";

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export default function ConvertIntakeForm({ quoteRequestId }: { quoteRequestId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const result = await convertIntakeToProject(quoteRequestId, formData);

    if (!result.ok) {
      setError(result.error ?? "Conversion failed.");
    } else {
      setSuccess(
        `Project created${result.checklistTaskCount ? ` with ${result.checklistTaskCount} checklist tasks` : ""}.`,
      );
    }
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 grid gap-2 sm:grid-cols-3">
      <label className="text-xs text-slate-400">
        Organization ID
        <input
          name="organizationId"
          required
          placeholder="00000000-0000-0000-0000-000000000000"
          className="mt-1 w-full rounded border border-white/10 bg-cyber-base/60 px-2 py-1.5 font-mono text-xs text-slate-200"
        />
      </label>
      <label className="text-xs text-slate-400">
        Project name (optional)
        <input
          name="projectName"
          placeholder="Defaults to customer name"
          className="mt-1 w-full rounded border border-white/10 bg-cyber-base/60 px-2 py-1.5 text-xs text-slate-200"
        />
      </label>
      <label className="text-xs text-slate-400">
        Priority
        <select
          name="priority"
          defaultValue="normal"
          className="mt-1 w-full rounded border border-white/10 bg-cyber-base/60 px-2 py-1.5 text-xs text-slate-200"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-emerald-600/40 bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 transition hover:bg-emerald-600/20 disabled:opacity-50"
        >
          {pending ? "Converting…" : "Convert to project"}
        </button>
        {error && (
          <span role="alert" className="ml-3 text-xs text-amber-400">
            {error}
          </span>
        )}
        {success && <span className="ml-3 text-xs text-emerald-400">{success}</span>}
      </div>
    </form>
  );
}
