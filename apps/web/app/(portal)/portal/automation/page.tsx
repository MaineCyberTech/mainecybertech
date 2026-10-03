import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";

import DataErrorNote from "@/components/admin/DataErrorNote";
import { formatDateTime } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Automation Workflows - Portal - Maine CyberTech" };

function runStatus(workflow: Record<string, unknown>): string {
  if (workflow.last_run_status) return String(workflow.last_run_status);
  return workflow.is_active === false ? "inactive" : "active";
}

function runStatusTone(status: string): "emerald" | "red" | "blue" | undefined {
  switch (status) {
    case "success":
      return "emerald";
    case "failed":
      return "red";
    case "running":
      return "blue";
    default:
      return undefined;
  }
}

export default async function PortalAutomationPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.eduAutomation.automation.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[automation/page]", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6" role="region" aria-label="Automation Workflows">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Automation Workflows" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Automation Workflows</h1>
      {loadFailed ? <DataErrorNote what="automation" /> : null}
      <p className="text-sm text-slate-400">
        {items.length} automation workflow{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div
            key={String(a.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{String(a.name || a.title || "")}</p>
              <StatusPill status={runStatus(a)} tone={runStatusTone(runStatus(a))} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Trigger: {String(a.trigger_type || "N/A")} &bull; Script:{" "}
              {String(a.script_type || "N/A")}
            </p>
            {(a.last_run_at as string | null) && (
              <p className="mt-1 text-xs text-slate-400">
                Last run: {formatDateTime(a.last_run_at)}
              </p>
            )}
          </div>
        ))}
        {!loadFailed && items.length === 0 && (
          <div className="col-span-2">
            <EmptyState icon="⚡" title="No automation workflows configured." />
          </div>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
