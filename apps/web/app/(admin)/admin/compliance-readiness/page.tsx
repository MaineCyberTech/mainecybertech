import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import CrudForm from "@/components/admin/CrudForm";
import { createComplianceFramework, createComplianceControl } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compliance Readiness - Admin - Maine CyberTech" };

type Props = { searchParams: Promise<{ organizationId?: string }> };

type Framework = { id: string; name: string; description: string | null };
type Control = { id: string; title: string; status: string };

export default async function AdminComplianceReadinessPage({ searchParams }: Props) {
  await requireAdminAccess();
  const api = getApiClient();
  const { organizationId } = await searchParams;

  let organizations: Array<{ id: string; name: string }> = [];
  try {
    const r = (await api.organizations.list({ limit: 100 })) as unknown as {
      items: Array<{ id: string; name: string }>;
    };
    organizations = r.items ?? [];
  } catch (error) {
    console.error("[admin/compliance-readiness]", error);
  }

  const orgId = organizationId ?? organizations[0]?.id ?? null;

  let frameworks: Array<Framework & { controls: Control[] }> = [];
  if (orgId) {
    try {
      const list = (await api.compliance.listFrameworks(orgId)) as unknown as Framework[];
      frameworks = await Promise.all(
        (list ?? []).map(async (f) => {
          let controls: Control[] = [];
          try {
            controls = (await api.compliance.listControls(f.id, orgId)) as unknown as Control[];
          } catch (error) {
            console.error("[admin/compliance-readiness]", error);
          }
          return { ...f, controls };
        }),
      );
    } catch (error) {
      console.error("[admin/compliance-readiness]", error);
    }
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[{ label: "Admin", href: "/admin" }, { label: "Compliance Readiness" }]}
        />
      }
      subnav={<AdminSubnav current="compliance-readiness" />}
      title="Compliance Readiness"
      description="Frameworks and controls for client readiness tracking."
      actions={null}
    >
      {organizations.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/admin/compliance-readiness?organizationId=${org.id}`}
              className={
                org.id === orgId
                  ? "rounded-md border border-emerald-600/40 bg-emerald-600/10 px-3 py-1 text-xs text-emerald-300"
                  : "rounded-md border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-emerald-600/40"
              }
            >
              {org.name}
            </Link>
          ))}
        </div>
      )}

      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "name", label: "Framework", required: true, placeholder: "NIST 800-53" },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        title="New Framework"
        action={createComplianceFramework}
      />

      <section className="cyber-panel mt-4">
        <h2 className="cyber-heading text-lg">Frameworks &amp; Controls</h2>
        <div className="mt-6 space-y-4">
          {frameworks.length > 0 ? (
            frameworks.map((f) => (
              <div key={f.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <p className="font-medium text-slate-50">{f.name}</p>
                {f.description ? (
                  <p className="mt-1 text-xs text-slate-400">{f.description}</p>
                ) : null}

                <ul className="mt-3 space-y-1">
                  {f.controls.map((c) => (
                    <li key={c.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{c.title}</span>
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-slate-400">
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </li>
                  ))}
                  {f.controls.length === 0 && (
                    <li className="text-xs text-slate-500">No controls yet.</li>
                  )}
                </ul>

                <div className="mt-3">
                  <CrudForm
                    fields={[{ key: "title", label: "New control", required: true }]}
                    title="Add control"
                    action={createComplianceControl}
                    hiddenFields={{ organizationId: orgId ?? "", frameworkId: f.id }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No frameworks defined.</p>
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
