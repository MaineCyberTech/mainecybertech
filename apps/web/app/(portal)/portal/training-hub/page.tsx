import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Training Hub - Portal - Maine CyberTech" };

export default async function PortalTrainingHubPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = (await api.trainingHub.courses.list({ organizationId: orgId })) as any;
    items = r.items as unknown as typeof items;
  } catch {}

  const difficultyColor = (level: string) => {
    const l = level.toLowerCase();
    if (l === "beginner") return "bg-emerald-500/10 text-emerald-400";
    if (l === "intermediate") return "bg-amber-500/10 text-amber-400";
    return "bg-red-500/10 text-red-400";
  };

  return (
    <div className="space-y-6" role="region" aria-label="Training Hub">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Training Hub" }]}
      />
      <PortalSubnav current="training-hub" />
      <h1 className="text-2xl font-semibold text-slate-50">Training Hub</h1>
      <p className="text-sm text-slate-400">Browse available microlearning courses.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((c) => (
          <div
            key={String(c.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(c.title)}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                {String(c.category || "General")}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColor(String(c.difficulty || "beginner"))}`}
              >
                {String(c.difficulty || "Beginner")}
              </span>
              <span className="text-xs text-slate-500">{Number(c.estimated_minutes || 0)} min</span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No courses available.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
