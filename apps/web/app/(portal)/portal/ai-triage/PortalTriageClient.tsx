"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getClientApi } from "@/lib/client-api";

type Analysis = {
  id: string;
  suggested_category: string;
  suggested_priority: string;
  suggested_subject: string;
  missing_info: string[] | null;
  confidence_score: number;
};

export default function PortalTriageClient({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState<"analyze" | "convert" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setError(null);
    setTicketId(null);
    setLoading("analyze");
    try {
      const result = (await getClientApi().ai.triageAnalyze({
        organizationId,
        rawDescription: description,
      })) as unknown as Analysis;
      setAnalysis(result);
    } catch {
      setError("Failed to analyze your description. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const createTicket = async () => {
    if (!analysis) return;
    setError(null);
    setLoading("convert");
    try {
      const result = (await getClientApi().ai.triageConvert({
        organizationId,
        triageId: analysis.id,
        subject: analysis.suggested_subject,
        category: analysis.suggested_category,
        priority: analysis.suggested_priority,
        ticketBody: description,
      })) as unknown as { ticket: { id: string } };
      setTicketId(result.ticket.id);
      setAnalysis(null);
      setDescription("");
      router.refresh();
    } catch {
      setError("Failed to create the ticket. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section
      className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
      aria-label="Report an issue"
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
        Report an issue
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Describe the problem. We will suggest a category and priority, then you can open a ticket.
      </p>

      <label className="mt-4 block text-xs text-slate-400">
        What is happening?
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe the issue in your own words…"
          className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading !== null || description.trim().length < 10}
          onClick={analyze}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading === "analyze" ? "Analyzing…" : "Analyze"}
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
        {ticketId && (
          <Link
            href={`/portal/support/${ticketId}`}
            className="text-sm text-emerald-400 underline hover:text-emerald-300"
          >
            Ticket created — view it
          </Link>
        )}
      </div>

      {analysis && (
        <div className="mt-4 rounded-lg border border-white/10 bg-cyber-base/80 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Suggested triage</p>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">Category</dt>
              <dd className="text-slate-200">{analysis.suggested_category}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Priority</dt>
              <dd className="text-slate-200">{analysis.suggested_priority}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Confidence</dt>
              <dd className="text-slate-200">{Math.round(analysis.confidence_score)}%</dd>
            </div>
          </dl>
          <p className="mt-2 text-sm text-slate-300">
            <span className="text-xs text-slate-500">Subject:</span> {analysis.suggested_subject}
          </p>
          {analysis.missing_info?.length ? (
            <p className="mt-2 text-xs text-amber-300">
              Missing info: {analysis.missing_info.join(", ")}
            </p>
          ) : null}
          <button
            type="button"
            disabled={loading !== null}
            onClick={createTicket}
            className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading === "convert" ? "Creating…" : "Create ticket"}
          </button>
        </div>
      )}
    </section>
  );
}
