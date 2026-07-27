import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "DMARC Coach - Portal - Maine CyberTech" };

export default async function PortalDmarcCoachPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = (await api.dmarcCoach.list({ organizationId: orgId })) as any;
    items = r.items as unknown as typeof items;
  } catch {}

  const gradeColor = (grade: string) => {
    const g = grade.toUpperCase();
    if (g === "A" || g === "A+") return "bg-emerald-500/10 text-emerald-400";
    if (g === "B") return "bg-blue-500/10 text-blue-400";
    if (g === "C") return "bg-amber-500/10 text-amber-400";
    return "bg-red-500/10 text-red-400";
  };

  return (
    <div className="space-y-6" role="region" aria-label="DMARC Coach">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "DMARC Coach" }]}
      />
      <PortalSubnav current="dmarc-coach" />
      <h1 className="text-2xl font-semibold text-slate-50">DMARC Coach</h1>
      <p className="text-sm text-slate-400">Review DNS security analysis for your domains.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((d) => (
          <div key={String(d.id)} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">{String(d.domain)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {Number(d.issues_count || 0)} issues found
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${gradeColor(String(d.overall_grade || "F"))}`}
              >
                {String(d.overall_grade || "N/A")}
              </span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No DMARC analyses yet.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
