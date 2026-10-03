"use client";

import { useState } from "react";
import { getClientApi } from "@/lib/client-api";

type TicketSummary = {
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  commentCount: number;
  keyPoints: string[];
  suggestedNextAction: string;
};

type ReplyDraft = { draftReply: string; ticketSubject: string; tone: string };

export default function TicketCopilotPanel({
  ticketId,
  organizationId,
}: {
  ticketId: string;
  organizationId: string;
}) {
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [draft, setDraft] = useState<ReplyDraft | null>(null);
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState<"summary" | "draft" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summarize = async () => {
    setError(null);
    setLoading("summary");
    try {
      setSummary(await getClientApi().ai.copilotSummarize(ticketId));
    } catch {
      setError("Failed to summarize this ticket.");
    } finally {
      setLoading(null);
    }
  };

  const draftReply = async () => {
    setError(null);
    setLoading("draft");
    try {
      setDraft(await getClientApi().ai.copilotReplyDraft(ticketId, { organizationId, tone }));
    } catch {
      setError("Failed to draft a reply.");
    } finally {
      setLoading(null);
    }
  };

  const insertDraft = () => {
    const textarea = document.getElementById("ticket-add-comment") as HTMLTextAreaElement | null;
    if (textarea && draft) textarea.value = draft.draftReply;
  };

  return (
    <section className="cyber-panel" aria-label="AI Copilot">
      <div className="flex items-center justify-between gap-3">
        <h2 className="cyber-heading text-lg">AI Copilot</h2>
        <span className="cyber-pill">Beta</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={summarize}
          disabled={loading !== null}
          className="cyber-button-secondary text-xs"
        >
          {loading === "summary" ? "Summarizing…" : "Summarize ticket"}
        </button>
        <label className="text-xs text-slate-400">
          Tone
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="ml-2 rounded-md border border-white/10 bg-cyber-base px-2 py-1 text-xs text-slate-50"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="concise">Concise</option>
          </select>
        </label>
        <button
          type="button"
          onClick={draftReply}
          disabled={loading !== null}
          className="cyber-button-secondary text-xs"
        >
          {loading === "draft" ? "Drafting…" : "Draft reply"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {summary && (
        <div className="mt-4 rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Summary</p>
          <p className="mt-2 text-sm text-slate-300">
            {summary.category} &bull; {summary.priority} &bull; {summary.status} &bull;{" "}
            {summary.commentCount} comment{summary.commentCount !== 1 ? "s" : ""}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {summary.keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
          {summary.suggestedNextAction && (
            <p className="mt-3 text-sm text-emerald-300">
              Suggested next action: {summary.suggestedNextAction}
            </p>
          )}
        </div>
      )}

      {draft && (
        <div className="mt-4 rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
              Draft reply ({draft.tone})
            </p>
            <button
              type="button"
              onClick={insertDraft}
              className="text-xs text-emerald-400 underline hover:text-emerald-300"
            >
              Insert into comment box
            </button>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {draft.draftReply}
          </p>
        </div>
      )}
    </section>
  );
}
