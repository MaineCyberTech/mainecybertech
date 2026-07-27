import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Triage - Portal - Maine CyberTech" };

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "analyzed"
      ? "bg-emerald-500/20 text-emerald-400"
      : status === "converted"
        ? "bg-sky-500/20 text-sky-400"
        : status === "pending"
          ? "bg-amber-500/20 text-amber-400"
          : "bg-slate-500/20 text-slate-400";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

function truncate(text: unknown, max: number): string {
  const str = String(text ?? "");
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export default async function AiTriagePage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.ai.triageList({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="AI Triage">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "AI Triage" }]}
      />
      <PortalSubnav current="ai-triage" />
      <h1 className="text-2xl font-semibold text-slate-50">AI Triage</h1>
      <p className="text-sm text-slate-400">
        {items.length} triage record{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <p className="text-xs text-slate-400">{truncate(item.raw_description, 100)}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              {item.suggested_category != null && (
                <span>Category: {String(item.suggested_category)}</span>
              )}
              {item.suggested_priority != null && (
                <span>Priority: {String(item.suggested_priority)}</span>
              )}
              {item.suggested_subject != null && (
                <span>Subject: {String(item.suggested_subject)}</span>
              )}
              {item.confidence_score != null && (
                <span>Confidence: {Math.round(Number(item.confidence_score) * 100)}%</span>
              )}
            </div>
            <div className="mt-2">
              <StatusBadge status={String(item.status ?? "pending")} />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No triage records found.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
