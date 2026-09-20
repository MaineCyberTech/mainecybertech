"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusPill from "@/components/StatusPill";
import { getClientApi } from "@/lib/client-api";

type AgendaItem = {
  id: string;
  meeting_id: string;
  change_request_id: string;
  decision: string;
  notes: string | null;
};

type Meeting = {
  id: string;
  scheduled_at: string | null;
  status: string;
  notes: string | null;
  agenda?: AgendaItem[];
};

type ChangeRequest = { id: string; title?: string; name?: string; status?: string };

export default function PortalCabClient({
  organizationId,
  meetings,
  pendingChanges,
}: {
  organizationId: string;
  meetings: Meeting[];
  pendingChanges: ChangeRequest[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState<Record<string, string>>({});

  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch {
        setError("Action failed. Please try again.");
      }
    });
  };

  const scheduleMeeting = () => {
    run(async () => {
      await getClientApi().cab.create({
        organizationId,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        notes: notes.trim() || null,
      });
      setScheduledAt("");
      setNotes("");
    });
  };

  const addToMeeting = (changeRequestId: string) => {
    const meetingId = selectedMeeting[changeRequestId];
    if (!meetingId) {
      setError("Choose a meeting first.");
      return;
    }
    run(() => getClientApi().cab.addAgendaItem(meetingId, { organizationId, changeRequestId }));
  };

  const decide = (itemId: string, decision: "approved" | "rejected") => {
    run(() => getClientApi().cab.updateAgendaItem(itemId, { decision }));
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="space-y-3" aria-label="Schedule CAB Meeting">
        <h2 className="text-lg font-medium text-slate-50">Schedule a meeting</h2>
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <label className="text-xs text-slate-400">
            Date &amp; time
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 block rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <label className="flex-1 text-xs text-slate-400">
            Notes
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agenda focus"
              className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <button
            type="button"
            disabled={isPending || !scheduledAt}
            onClick={scheduleMeeting}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Schedule meeting"}
          </button>
        </div>
      </section>

      <section className="space-y-3" aria-label="CAB Meetings">
        <h2 className="text-lg font-medium text-slate-50">Meetings</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {meetings.map((m) => {
            const agenda = Array.isArray(m.agenda) ? m.agenda : [];
            return (
              <div key={m.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-50">
                    {m.scheduled_at
                      ? new Date(m.scheduled_at).toISOString().slice(0, 10)
                      : "Unscheduled"}
                  </p>
                  <StatusPill status={m.status || "unknown"} />
                </div>
                {m.notes ? <p className="mt-1 text-xs text-slate-400">{m.notes}</p> : null}
                <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                  Agenda ({agenda.length})
                </p>
                <ul className="mt-1 space-y-2">
                  {agenda.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-300">
                        Change: {a.change_request_id.slice(0, 8)}
                      </span>
                      <span className="flex items-center gap-2">
                        <StatusPill status={a.decision || "pending"} />
                        <button
                          type="button"
                          disabled={isPending || a.decision === "approved"}
                          onClick={() => decide(a.id, "approved")}
                          className="rounded bg-emerald-600/80 px-2 py-0.5 text-white hover:bg-emerald-500 disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={isPending || a.decision === "rejected"}
                          onClick={() => decide(a.id, "rejected")}
                          className="rounded bg-red-600/80 px-2 py-0.5 text-white hover:bg-red-500 disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </span>
                    </li>
                  ))}
                  {agenda.length === 0 && (
                    <li className="text-xs text-slate-500">No agenda items.</li>
                  )}
                </ul>
              </div>
            );
          })}
          {meetings.length === 0 && (
            <p className="col-span-2 text-sm text-slate-400">No CAB meetings scheduled.</p>
          )}
        </div>
      </section>

      <section className="space-y-3" aria-label="Pending Change Requests">
        <h2 className="text-lg font-medium text-slate-50">Pending change requests</h2>
        <p className="text-xs text-slate-500">
          Choose a meeting, then add the change to its agenda.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {pendingChanges.map((c) => (
            <div key={c.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-50">{c.title || c.name || ""}</p>
                <StatusPill status={c.status || "unknown"} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <select
                  aria-label="Meeting"
                  value={selectedMeeting[c.id] ?? ""}
                  onChange={(e) =>
                    setSelectedMeeting((prev) => ({ ...prev, [c.id]: e.target.value }))
                  }
                  className="rounded-md border border-white/10 bg-cyber-base px-2 py-1 text-xs text-slate-50"
                >
                  <option value="">Select meeting…</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.scheduled_at
                        ? new Date(m.scheduled_at).toISOString().slice(0, 10)
                        : "Unscheduled"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={isPending || meetings.length === 0}
                  onClick={() => addToMeeting(c.id)}
                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  Add to agenda
                </button>
              </div>
            </div>
          ))}
          {pendingChanges.length === 0 && (
            <p className="col-span-2 text-sm text-slate-400">No pending change requests.</p>
          )}
        </div>
      </section>
    </div>
  );
}
