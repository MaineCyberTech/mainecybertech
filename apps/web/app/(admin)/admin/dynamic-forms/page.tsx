import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dynamic Forms - Admin" };

export default async function DynamicFormsAdminPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.dynamicForms.list({ limit: 100, page: 1 });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Dynamic Forms" }]} />
      }
      subnav={<AdminSubnav current="dynamic-forms" />}
      title="Dynamic Client Forms"
      description="Manage client intake forms, questionnaires, and submissions across all organizations."
      actions={
        <Link href="/portal/dynamic-client-forms-builder" className="cyber-button-secondary">
          Open Portal Builder
        </Link>
      }
    >
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((f) => {
              const submissions = f.submission_count ?? 0;
              return (
                <div
                  key={String(f.id)}
                  className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
                >
                  <Link
                    className="transition hover:text-emerald-400"
                    href={`/admin/dynamic-forms/${f.id}`}
                  >
                    <p className="font-medium text-slate-50">{String(f.form_name)}</p>
                  </Link>
                  <p className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      {String(f.form_type || "unknown")}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5">
                      {String(f.status || "draft")}
                    </span>
                    {typeof submissions === "number" && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5">
                        {submissions} submissions
                      </span>
                    )}
                    {f.published_at != null && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5">
                        Published
                      </span>
                    )}
                  </p>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon="📝"
              title="No forms"
              description="Create client intake or questionnaire forms from the portal builder."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
