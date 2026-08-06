import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DynamicFormAdminActions from "./DynamicFormAdminActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dynamic Form Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  let submissions: Array<Record<string, unknown>> = [];
  try {
    record = (await api.dynamicForms.get(id)) as unknown as Record<string, unknown>;
  } catch {}
  try {
    const r = await api.dynamicForms.listSubmissions(id, { limit: 50, page: 1 });
    submissions = (r?.items as unknown as Array<Record<string, unknown>>) ?? [];
  } catch {}

  const formName = String(record?.form_name ?? record?.title ?? "Form Detail");

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Dynamic Forms", href: "/admin/dynamic-forms" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="dynamic-forms" />}
      title={formName}
    >
      {record && <DynamicFormAdminActions id={id} status={String(record.status ?? "draft")} />}

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Form Fields</h2>
            {record?.fields && Array.isArray(record.fields) && record.fields.length > 0 ? (
              <div className="mt-4 space-y-2">
                {(record.fields as Array<Record<string, unknown>>)
                  .slice()
                  .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
                  .map((field) => (
                    <div
                      key={String(field.key)}
                      className="rounded-lg border border-white/5 bg-[#0A1118]/60 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-50">{String(field.label)}</span>
                        {field.required === true && (
                          <span className="text-[10px] text-red-400">*</span>
                        )}
                        <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                          {String(field.type)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No fields defined.</p>
            )}
          </section>

          {submissions.length > 0 && (
            <section className="cyber-panel">
              <h2 className="cyber-heading text-lg">Submissions ({submissions.length})</h2>
              <div className="mt-4 space-y-2">
                {submissions.map((sub) => (
                  <div
                    key={String(sub.id)}
                    className="rounded-lg border border-white/5 bg-[#0A1118]/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-50">
                        {String(sub.respondent_email || "Anonymous")}
                      </span>
                      {sub.submitted_at != null && (
                        <span className="text-[11px] text-slate-400">
                          {new Date(String(sub.submitted_at)).toISOString().slice(0, 16)}
                        </span>
                      )}
                    </div>
                    <pre className="mt-2 max-h-24 overflow-auto text-xs text-slate-400">
                      {JSON.stringify(sub.answers ?? {}, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <dt className="text-slate-400">Type</dt>
                <dd className="text-slate-50">{String(record?.form_type ?? "—")}</dd>
                <dt className="text-slate-400">Status</dt>
                <dd className="text-slate-50">{String(record?.status ?? "—")}</dd>
                <dt className="text-slate-400">Fields</dt>
                <dd className="text-slate-50">
                  {Array.isArray(record?.fields) ? record.fields.length : 0}
                </dd>
                <dt className="text-slate-400">Submissions</dt>
                <dd className="text-slate-50">{submissions.length}</dd>
                <dt className="text-slate-400">Created</dt>
                <dd className="text-slate-50">
                  {record?.created_at
                    ? new Date(String(record.created_at)).toISOString().slice(0, 10)
                    : "—"}
                </dd>
                {record?.published_at != null && (
                  <>
                    <dt className="text-slate-400">Published</dt>
                    <dd className="text-slate-50">
                      {new Date(String(record.published_at)).toISOString().slice(0, 10)}
                    </dd>
                  </>
                )}
                {record?.closes_at != null && (
                  <>
                    <dt className="text-slate-400">Closes</dt>
                    <dd className="text-slate-50">
                      {new Date(String(record.closes_at)).toISOString().slice(0, 10)}
                    </dd>
                  </>
                )}
              </div>
            </dl>
          </section>
          <Link
            href="/admin/dynamic-forms"
            className="text-sm text-emerald-500 hover:text-emerald-400"
          >
            &larr; Back to Dynamic Forms
          </Link>
        </div>
      </div>
    </AdminPageShell>
  );
}
