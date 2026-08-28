import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compliance Readiness - Portal - Maine CyberTech" };

type Framework = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

type Control = {
  id: string;
  framework_id: string;
  organization_id: string;
  title: string;
  status: string;
  owner: string | null;
  due_at: string | null;
  notes: string | null;
  created_at: string;
};

export default async function PortalComplianceReadinessPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;

  let frameworks: Framework[] = [];
  let controls: Control[] = [];
  try {
    frameworks = await api.compliance.listFrameworks(orgId);
    const controlSets = await Promise.all(
      frameworks.map((f) => api.compliance.listControls(f.id, orgId)),
    );
    controls = controlSets.flat();
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Compliance Readiness">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Compliance Readiness" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Compliance Readiness</h1>
      <p className="text-sm text-slate-400">
        {frameworks.length} compliance framework{frameworks.length !== 1 ? "s" : ""} tracked for
        your organization.
      </p>
      <div className="space-y-4">
        {frameworks.map((f) => {
          const frameworkControls = controls.filter((c) => c.framework_id === f.id);
          return (
            <div
              key={f.id}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-50">{f.name}</p>
                <StatusPill
                  status={
                    frameworkControls.length === 0
                      ? "unknown"
                      : frameworkControls.every((c) => c.status === "implemented")
                        ? "implemented"
                        : frameworkControls.some((c) => c.status === "implemented")
                          ? "in_progress"
                          : "not_started"
                  }
                />
              </div>
              {f.description && (
                <p className="mt-1 text-xs text-slate-400">{f.description}</p>
              )}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-400">
                      <th className="py-1 pr-4">Control</th>
                      <th className="py-1 pr-4">Status</th>
                      <th className="py-1 pr-4">Owner</th>
                      <th className="py-1 pr-4">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frameworkControls.map((c) => (
                      <tr key={c.id} className="border-t border-white/5">
                        <td className="py-1 pr-4 text-slate-200">{c.title}</td>
                        <td className="py-1 pr-4">
                          <StatusPill status={c.status} />
                        </td>
                        <td className="py-1 pr-4 text-slate-300">
                          {c.owner ?? "—"}
                        </td>
                        <td className="py-1 pr-4 text-slate-300">
                          {c.due_at
                            ? new Date(c.due_at).toISOString().slice(0, 10)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                    {frameworkControls.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-2 text-xs text-slate-400"
                        >
                          No controls yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
        {frameworks.length === 0 && (
          <p className="text-sm text-slate-400">No compliance frameworks yet.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
