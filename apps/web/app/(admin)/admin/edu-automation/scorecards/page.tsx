import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import ScorecardsEvaluateClient from "./ScorecardsEvaluateClient";
import { createScorecard } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cyber Scorecard - Edu & Automation - Admin" };

export default async function ScorecardPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; category?: string }> = [];
  try {
    const r = await api.eduAutomation.scorecards.list({});
    items = (r as { items: typeof items }).items as typeof items;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Edu & Automation", href: "/admin/edu-automation" },
            { label: "Cyber Scorecard" },
          ]}
        />
      }
      subnav={<AdminSubnav current="edu-automation" />}
      title="Cyber Scorecard"
      description="Category-based cybersecurity scores with badges."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "category", label: "Category", required: true },
          { key: "score", label: "Score", type: "number" },
          { key: "badge", label: "Badge" },
        ]}
        title="New Scorecard"
        action={createScorecard}
      />
      <div className="mt-6">
        <ScorecardsEvaluateClient organizationId={""} />
      </div>
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/edu-automation/scorecards/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.category ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📊"
              title="No scorecards"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
