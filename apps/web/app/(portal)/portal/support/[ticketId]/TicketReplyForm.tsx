"use client";

import { useState, useTransition } from "react";
import { addPortalTicketComment } from "./actions";

export default function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    startTransition(async () => {
      const result = await addPortalTicketComment(fd);
      if (!result.ok) setError(result.error ?? "Failed to post comment");
      else setBody("");
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-lg border border-white/10 bg-cyber-base/60 p-4"
    >
      <input type="hidden" name="ticketId" value={ticketId} />
      <label htmlFor="reply-body" className="mb-1 block text-xs font-medium text-slate-400">
        Add a reply
      </label>
      <textarea
        id="reply-body"
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={3}
        placeholder="Share an update or ask a question..."
        className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
      />
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={pending || body.trim().length === 0}
        className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Posting..." : "Post Reply"}
      </button>
    </form>
  );
}
