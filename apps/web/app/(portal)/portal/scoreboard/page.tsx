import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cyber Scoreboard - Portal - Maine CyberTech" };

export default async function PortalScoreboardPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.eduAutomation.scorecards.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[scoreboard/page]", error);
  }

  return (
    <div className="space-y-6" role="region" aria-label="Cyber Scoreboard">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Cyber Scoreboard" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Cyber Scoreboard</h1>
      <p className="text-sm text-slate-400">
        {items.length} scorecard{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => {
          const score = Number(a.score ?? 0);
          const max = Number(a.max_score ?? 100) || 100;
          const pct = Math.max(0, Math.min(100, Math.round((score / max) * 100)));
          const cheer =
            pct >= 90
              ? "Outstanding - you are a cyber champion!"
              : pct >= 70
                ? "Nice work - keep the streak going!"
                : pct >= 40
                  ? "Good start - a few quick wins left."
                  : "Let's level up your cyber hygiene together.";
          return (
            <div
              key={String(a.id)}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-50">{String(a.category || "Overall")}</p>
                <span className="rounded bg-emerald-600/15 px-1.5 py-0.5 text-xs font-medium text-emerald-300">
                  {String(a.badge || "No badge")}
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${String(a.category || "Overall")} score`}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Score: {score}/{max} ({pct}%)
              </p>
              <p className="mt-1 text-xs text-emerald-400">{cheer}</p>
              {a.last_updated ? (
                <p className="mt-1 text-xs text-slate-400">
                  Last updated: {new Date(String(a.last_updated)).toISOString().slice(0, 10)}
                </p>
              ) : null}
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No scorecards available.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
