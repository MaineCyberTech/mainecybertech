"use client";

import { useState } from "react";
import { getClientApi } from "@/lib/client-api";

type Props = {
  organizations: { id: string; name: string }[];
};

type AnalysisResult = {
  id: string;
  raw_description: string;
  suggested_category: string;
  suggested_priority: string;
  suggested_subject: string;
  missing_info: string[];
  confidence_score: number;
  status: string;
  created_at: string;
};

export default function TriageAnalyzeClient({ organizations }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const organizationId = fd.get("organizationId") as string;
    const rawDescription = fd.get("rawDescription") as string;

    if (!organizationId) {
      setError("Select an organization.");
      return;
    }
    if (!rawDescription || rawDescription.length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const api = getClientApi();
      const r = await api.ai.triageAnalyze({ organizationId, rawDescription });
      setResult(r as unknown as AnalysisResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze description.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConvert() {
    if (!result) return;
    const organizationId = (document.getElementById("org-select") as HTMLSelectElement).value;
    const ticketBody =
      (document.getElementById("ticket-body") as HTMLTextAreaElement)?.value ||
      result.raw_description;
    const subject =
      (document.getElementById("subject-input") as HTMLInputElement)?.value ||
      result.suggested_subject;

    setConverting(true);
    setError(null);

    try {
      const api = getClientApi();
      await api.ai.triageConvert({
        organizationId,
        triageId: result.id,
        subject,
        category: result.suggested_category,
        priority: result.suggested_priority,
        ticketBody,
      });
      alert("Ticket created successfully!");
      setResult(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to convert to ticket.");
    } finally {
      setConverting(false);
    }
  }

  const priorityColor = (p: string) =>
    p === "urgent" || p === "high"
      ? "text-red-400"
      : p === "normal"
        ? "text-amber-400"
        : "text-emerald-400";

  return (
    <div className="space-y-6">
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Analyze Description</h2>
        <p className="mt-2 text-sm text-slate-400">
          Paste a client&apos;s issue description below. The AI will suggest a category, priority,
          subject line, and flag missing information.
        </p>
        <form onSubmit={handleAnalyze} className="mt-4 space-y-4">
          <div>
            <label htmlFor="org-select" className="block text-sm font-medium text-slate-300">
              Organization
            </label>
            <select
              id="org-select"
              name="organizationId"
              className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200"
              required
            >
              <option value="">Select organization...</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="raw-desc" className="block text-sm font-medium text-slate-300">
              Client Description
            </label>
            <textarea
              id="raw-desc"
              name="rawDescription"
              rows={6}
              placeholder="e.g. My laptop won't turn on after the power outage yesterday. The battery light blinks amber when I press the power button. I have a Dell Latitude 5540 running Windows 11."
              className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
              required
              minLength={10}
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <button type="submit" disabled={analyzing} className="cyber-button disabled:opacity-50">
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </form>
      </section>

      {result && (
        <>
          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Analysis Result</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Category
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-200">
                  {result.suggested_category}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Priority
                </p>
                <p
                  className={`mt-1 text-sm font-semibold capitalize ${priorityColor(result.suggested_priority)}`}
                >
                  {result.suggested_priority}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Confidence
                </p>
                <div className="mt-1 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${result.confidence_score}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-300">{result.confidence_score}%</span>
                </div>
              </div>
              {result.missing_info.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Missing Information
                  </p>
                  <ul className="mt-1 list-inside list-disc space-y-1">
                    {result.missing_info.map((info, i) => (
                      <li key={i} className="text-sm text-amber-300">
                        {info}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Convert to Ticket</h2>
            <p className="mt-2 text-sm text-slate-400">
              Review and edit the fields below, then create the ticket.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="subject-input" className="block text-sm font-medium text-slate-300">
                  Subject
                </label>
                <input
                  id="subject-input"
                  defaultValue={result.suggested_subject}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <div>
                <label htmlFor="ticket-body" className="block text-sm font-medium text-slate-300">
                  Ticket Body
                </label>
                <textarea
                  id="ticket-body"
                  rows={5}
                  defaultValue={result.raw_description}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200"
                />
              </div>
              <button
                onClick={handleConvert}
                disabled={converting}
                className="cyber-button disabled:opacity-50"
              >
                {converting ? "Creating Ticket..." : "Create Ticket"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
