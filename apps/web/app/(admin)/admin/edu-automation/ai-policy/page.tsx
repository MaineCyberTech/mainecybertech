import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createAiPolicy } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Policy - Edu & Automation - Admin" };

export default async function AiPolicyPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; title?: string }> = [];
  try {
    const r = await api.eduAutomation.aiPolicy.list({});
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
            { label: "AI Policy" },
          ]}
        />
      }
      subnav={<AdminSubnav current="edu-automation" />}
      title="AI Policy"
      description="AI usage policies with data handling rules and employee guidance."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "title", label: "Title", required: true },
          { key: "content", label: "Content", type: "textarea" },
          { key: "dataHandlingRules", label: "Data Handling", type: "textarea" },
          { key: "employeeGuidance", label: "Employee Guidance", type: "textarea" },
        ]}
        title="New AI Policy"
        action={createAiPolicy}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/edu-automation/ai-policy/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.title ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🤖"
              title="No AI policies"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
