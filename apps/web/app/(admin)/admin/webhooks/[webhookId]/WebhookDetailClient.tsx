"use client";

import { useState } from "react";
import { getClientApi } from "@/lib/client-api";

const EVENT_OPTIONS = [
  "ticket.created", "ticket.updated", "ticket.assigned",
  "project.created", "project.updated",
  "document.created", "document.updated",
  "membership.created", "membership.updated",
  "billing.invoice.paid", "billing.invoice.overdue",
];

type Props = {
  webhook: any;
  deliveries: any[];
  totalDeliveries: number;
};

export default function WebhookDetailClient({ webhook, deliveries, totalDeliveries }: Props) {
  const [name, setName] = useState(webhook.name);
  const [url, setUrl] = useState(webhook.url);
  const [secret, setSecret] = useState(webhook.secret ?? "");
  const [events, setEvents] = useState<string[]>(webhook.events ?? []);
  const [isActive, setIsActive] = useState(webhook.is_active);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleEvent(event: string) {
    setEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await getClientApi().webhooks.update(webhook.id, { name, url, secret: secret || null, events, isActive });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  }

  async function handleTest() {
    setTesting(true); setTestResult(null);
    try {
      const result = await getClientApi().webhooks.test(webhook.id);
      if (result.ok) setTestResult(`Success (${result.status}ms)`);
      else setTestResult(`Failed: ${result.error ?? "Unknown"} (${result.duration_ms ?? "?"}ms)`);
    } catch { setTestResult("Request failed"); }
    setTesting(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this webhook endpoint?")) return;
    setDeleting(true);
    try {
      await getClientApi().webhooks.remove(webhook.id);
      window.location.href = "/admin/webhooks";
    } catch { setDeleting(false); }
  }

  return (
    <div className="space-y-6">
      {saved ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Saved.</div>
      ) : null}

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Configuration</h2>
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="cyber-label">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="cyber-input" />
            </div>
            <div>
              <label className="cyber-label">Status</label>
              <select value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")} className="cyber-input">
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="cyber-label">URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} className="cyber-input font-mono text-sm" placeholder="https://example.com/webhook" />
          </div>
          <div>
            <label className="cyber-label">Secret (optional)</label>
            <input value={secret} onChange={(e) => setSecret(e.target.value)} className="cyber-input font-mono text-sm" placeholder="Shared secret for HMAC signing" />
          </div>
          <div>
            <label className="cyber-label">Events</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {EVENT_OPTIONS.map((event) => (
                <label key={event} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={events.includes(event)} onChange={() => toggleEvent(event)} className="accent-emerald-600" />
                  <span className="text-xs text-slate-300">{event}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleSave} disabled={saving} className="cyber-button">{saving ? "Saving..." : "Save"}</button>
            <button onClick={handleTest} disabled={testing} className="cyber-button-secondary">{testing ? "Testing..." : "Test Webhook"}</button>
            <button onClick={handleDelete} disabled={deleting} className="cyber-button-danger text-xs ml-auto">{deleting ? "Deleting..." : "Delete"}</button>
          </div>
          {testResult ? <div className="text-sm text-slate-300">{testResult}</div> : null}
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Delivery Log ({totalDeliveries})</h2>
        <div className="mt-6 overflow-x-auto">
          {deliveries.length === 0 ? (
            <div className="py-4 text-sm text-slate-500">No deliveries yet.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider">Event</th>
                  <th className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider">Response</th>
                  <th className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d: any) => (
                  <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-3 py-3 text-slate-200 font-mono text-xs">{d.event}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        d.status === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/20 bg-red-500/10 text-red-300"
                      }`}>{d.status}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-400">{d.response_status ?? "—"}</td>
                    <td className="px-3 py-3 text-slate-400">{d.duration_ms != null ? `${d.duration_ms}ms` : "—"}</td>
                    <td className="px-3 py-3 text-slate-500 text-xs">{new Date(d.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
