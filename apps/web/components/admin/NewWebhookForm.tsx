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
  organizations: { id: string; name: string }[];
};

export default function NewWebhookForm({ organizations }: Props) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const events = Array.from(e.currentTarget.querySelectorAll('input[name="events"]:checked')).map((cb: any) => cb.value);
    if (!events.length) { alert("Select at least one event"); return; }
    const data = {
      organizationId: fd.get("organizationId") as string,
      name: fd.get("name") as string,
      url: fd.get("url") as string,
      secret: (fd.get("secret") as string) || null,
      events,
    };
    setSaving(true);
    try {
      await getClientApi().webhooks.create(data);
      window.location.href = "/admin/webhooks";
    } catch { alert("Failed to create webhook"); }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="cyber-label">Organization</label>
          <select name="organizationId" required className="cyber-input">
            <option value="">Select...</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="cyber-label">Name</label>
          <input name="name" required className="cyber-input" placeholder="My Webhook" />
        </div>
      </div>
      <div>
        <label className="cyber-label">URL</label>
        <input name="url" type="url" required className="cyber-input font-mono text-sm" placeholder="https://example.com/webhook" />
      </div>
      <div>
        <label className="cyber-label">Secret (optional)</label>
        <input name="secret" className="cyber-input font-mono text-sm" placeholder="Shared secret for HMAC signing" />
      </div>
      <div>
        <label className="cyber-label">Events</label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {EVENT_OPTIONS.map((event) => (
            <label key={event} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="events" value={event} className="accent-emerald-600" />
              <span className="text-xs text-slate-300">{event}</span>
            </label>
          ))}
        </div>
      </div>
      <button type="submit" disabled={saving} className="cyber-button">{saving ? "Creating..." : "Create Webhook"}</button>
    </form>
  );
}
