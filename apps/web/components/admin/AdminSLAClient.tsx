"use client";

import { useMemo, useState } from "react";

type Org = Record<string, any> & { id: string; name?: string };
type SLAMetrics = {
  summary: { total: number; breached: number; breachedRate: number; resolved: number };
  byMetric: Record<string, { total: number; breached: number; avgMinutes: number }>;
  recent: Array<{ id: string; metric: string; target_minutes: number; actual_minutes: number | null; breached: boolean; created_at: string }>;
};

export default function AdminSLAClient({
  organizations,
  initialMetrics,
}: {
  organizations: Org[];
  initialMetrics: SLAMetrics | null;
}) {
  const [orgFilter, setOrgFilter] = useState("");
  const [days, setDays] = useState(30);

  const metrics = initialMetrics;

  const metricLabels: Record<string, string> = {
    first_response: "First Response",
    resolution: "Resolution",
    triage: "Triage",
  };

  if (!metrics) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">
        No SLA data available for the selected period.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <label className="cyber-label">Organization</label>
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="cyber-input"
          >
            <option value="">All organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>{org.name ?? org.id}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[120px]">
          <label className="cyber-label">Days</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="cyber-input"
          >
            {[7, 14, 30, 60, 90].map((d) => (
              <option key={d} value={d}>{d} days</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cyber-panel">
          <p className="text-sm text-slate-400">Total Events</p>
          <p className="mt-1 text-2xl font-bold text-slate-50">{metrics.summary.total}</p>
        </div>
        <div className="cyber-panel">
          <p className="text-sm text-slate-400">Breached</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{metrics.summary.breached}</p>
        </div>
        <div className="cyber-panel">
          <p className="text-sm text-slate-400">Breach Rate</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{metrics.summary.breachedRate}%</p>
        </div>
        <div className="cyber-panel">
          <p className="text-sm text-slate-400">Resolved</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{metrics.summary.resolved}</p>
        </div>
      </div>

      <section className="cyber-panel">
        <h3 className="cyber-heading text-lg">By Metric</h3>
        <div className="mt-4 space-y-3">
          {Object.entries(metrics.byMetric).length > 0 ? (
            Object.entries(metrics.byMetric).map(([key, m]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div>
                  <p className="font-medium text-slate-50">{metricLabels[key] ?? key}</p>
                  <p className="text-xs text-slate-500">{m.total} events, {m.breached} breached</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Avg {Math.round(m.avgMinutes)} min</p>
                  <p className={`text-xs ${m.breached > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {m.total > 0 ? Math.round((m.breached / m.total) * 100) : 0}% breach rate
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No metric data available.</p>
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <h3 className="cyber-heading text-lg">Recent SLA Events</h3>
        <div className="mt-4 space-y-2">
          {metrics.recent.length > 0 ? (
            metrics.recent.map((event) => (
              <div
                key={event.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  event.breached
                    ? "border-red-500/20 bg-red-500/5"
                    : "border-white/10 bg-[#0A1118]/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    event.breached
                      ? "bg-red-500/10 text-red-300"
                      : "bg-emerald-500/10 text-emerald-300"
                  }`}>
                    {event.breached ? "BREACHED" : "OK"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {metricLabels[event.metric] ?? event.metric}
                    </p>
                    {event.actual_minutes && (
                      <p className="text-xs text-slate-500">
                        {event.actual_minutes} min (target: {event.target_minutes} min)
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(event.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No recent SLA events.</p>
          )}
        </div>
      </section>
    </div>
  );
}