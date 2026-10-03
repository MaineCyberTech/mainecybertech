"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

type Target = { id: string; email: string; name: string | null; status: string };

export default function PhishingTargetsPanel({ campaignId }: { campaignId: string }) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setError(null);
    const api = getClientApi();
    try {
      let orgId = organizationId;
      if (!orgId) {
        const campaign = (await api.eduAutomation.phishing.get(campaignId)) as unknown as {
          organization_id?: string;
        };
        orgId = campaign.organization_id ?? null;
        setOrganizationId(orgId);
      }
      if (!orgId) {
        setError("Could not resolve the campaign's organisation.");
        return;
      }
      const r = (await api.eduAutomation.phishing.listTargets(campaignId, orgId)) as unknown as {
        items: Target[];
      };
      setTargets(r.items ?? []);
    } catch {
      setError("Failed to load targets.");
    }
  }, [campaignId, organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const addTarget = () => {
    if (!organizationId) return;
    setError(null);
    startTransition(async () => {
      try {
        await getClientApi().eduAutomation.phishing.createTarget(campaignId, organizationId, {
          email: email.trim(),
          name: name.trim() || null,
        });
        setEmail("");
        setName("");
        await load();
      } catch {
        setError("Failed to add the target.");
      }
    });
  };

  const removeTarget = (targetId: string) => {
    if (!organizationId) return;
    setError(null);
    startTransition(async () => {
      try {
        await getClientApi().eduAutomation.phishing.removeTarget(
          campaignId,
          targetId,
          organizationId,
        );
        await load();
      } catch {
        setError("Failed to remove the target.");
      }
    });
  };

  return (
    <section
      className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
      aria-label="Phishing targets"
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
        Simulation targets
      </h3>
      <p className="mt-1 text-xs text-slate-400">
        The worker sends the awareness simulation to each target when the campaign is launched.
      </p>

      <ul className="mt-3 space-y-1">
        {targets.map((t) => (
          <li key={t.id} className="flex items-center justify-between text-sm">
            <span className="text-slate-300">
              {t.email}
              {t.name ? ` (${t.name})` : ""}
            </span>
            <span className="flex items-center gap-3 text-xs text-slate-400">
              <span className="rounded bg-white/5 px-1.5 py-0.5">{t.status}</span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => removeTarget(t.id)}
                className="text-red-400 underline hover:text-red-300 disabled:opacity-50"
              >
                Remove
              </button>
            </span>
          </li>
        ))}
        {targets.length === 0 && <li className="text-sm text-slate-400">No targets yet.</li>}
      </ul>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-400">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="text-xs text-slate-400">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <button
          type="button"
          disabled={isPending || !email.trim()}
          onClick={addTarget}
          className="cyber-button-secondary text-xs"
        >
          Add target
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </section>
  );
}
