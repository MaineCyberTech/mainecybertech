"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientApi } from "@/lib/client-api";

type Preference = {
  id: string;
  organization_id?: string | null;
  module_key: string;
  channel: string;
  enabled: boolean;
};

const MODULES = [
  { key: "tickets", label: "Tickets" },
  { key: "projects", label: "Projects" },
  { key: "documents", label: "Documents" },
  { key: "billing", label: "Billing" },
  { key: "system", label: "System" },
];

const CHANNELS = [
  { key: "email", label: "Email" },
  { key: "in_app", label: "In-App" },
];

function moduleIcon(moduleKey: string) {
  const icons: Record<string, string> = { tickets: "🎫", projects: "📋", documents: "📄", billing: "💳", system: "⚙️" };
  return icons[moduleKey] ?? "🔔";
}

export default function NotificationPreferencesClient() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const result = await getClientApi().notifications.listPreferences();
      setPreferences(result.preferences);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  function isEnabled(moduleKey: string, channel: string): boolean {
    const pref = preferences.find((p) => p.module_key === moduleKey && p.channel === channel);
    return pref ? pref.enabled : true;
  }

  async function toggle(moduleKey: string, channel: string) {
    const current = isEnabled(moduleKey, channel);
    setPreferences((prev) => {
      const existing = prev.find((p) => p.module_key === moduleKey && p.channel === channel);
      if (existing) {
        return prev.map((p) => p.id === existing.id ? { ...p, enabled: !current } : p);
      }
      return [...prev, { id: "", organization_id: null, module_key: moduleKey, channel, enabled: !current }];
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const prefsPayload = MODULES.flatMap((m) =>
      CHANNELS.map((c) => ({
        moduleKey: m.key,
        channel: c.key,
        enabled: isEnabled(m.key, c.key),
      }))
    );

    try {
      await getClientApi().notifications.updatePreferences({ preferences: prefsPayload });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    setSaving(false);
  }

  if (loading) {
    return <div className="py-8 text-center text-sm text-slate-500">Loading preferences...</div>;
  }

  return (
    <div className="space-y-4">
      {saved ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Preferences saved successfully.
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-500">Module</th>
              {CHANNELS.map((c) => (
                <th key={c.key} className="px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-500 text-center">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => (
              <tr key={m.key} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium text-slate-200">
                  <span className="mr-2">{moduleIcon(m.key)}</span>
                  {m.label}
                </td>
                {CHANNELS.map((c) => {
                  const enabled = isEnabled(m.key, c.key);
                  return (
                    <td key={c.key} className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(m.key, c.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          enabled ? "bg-emerald-600" : "bg-slate-700"
                        }`}
                        role="switch"
                        aria-checked={enabled}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          enabled ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="cyber-button">
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>

      <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-xs text-slate-500">
        Changes take effect immediately. In-app notifications appear in the bell icon in the header.
        Email notifications require SMTP to be configured on the server.
      </div>
    </div>
  );
}
