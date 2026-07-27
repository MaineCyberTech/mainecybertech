import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";

export const metadata = { title: "Form Detail - Portal - Maine CyberTech" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function rel(value?: string | null) {
  if (!value) return "\u2014";
  const s = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(value).toISOString().slice(0, 10);
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: "border-slate-500/25 bg-slate-500/10 text-slate-300",
    published: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    closed: "border-red-500/25 bg-red-500/10 text-red-300",
  };
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${styles[status] || "border-white/10 bg-white/5 text-slate-300"}`}
    >
      {status}
    </span>
  );
}

function fieldTypeBadge(type: string) {
  return (
    <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
      {type}
    </span>
  );
}

export default async function DynamicFormDetailPage({ params }: Props) {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) notFound();
  const { id } = await params;
  const api = getApiClient();

  let form: {
    id: string;
    title: string;
    description: string | null;
    form_type: string;
    status: string;
    fields: Array<{
      key: string;
      label: string;
      type: string;
      required: boolean;
      placeholder: string | null;
      options: string[];
      helpText: string | null;
      sortOrder: number;
    }>;
    settings: Record<string, unknown>;
    published_at: string | null;
    closes_at: string | null;
    created_at: string;
    updated_at: string;
  } | null = null;

  let submissions: Array<{
    id: string;
    respondent_email: string | null;
    answers: Record<string, unknown>;
    status: string;
    submitted_at: string;
  }> = [];

  try {
    const formResult = await api.dynamicForms.get(id);
    form = formResult as any;
  } catch {
    notFound();
  }

  if (!form) notFound();

  try {
    const subResult = await api.dynamicForms.listSubmissions(id, { limit: 50, page: 1 });
    submissions = (subResult?.items as any) ?? [];
  } catch {
    // Gracefully handle
  }

  const isExpired = form.closes_at ? new Date(form.closes_at) < new Date() : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: "Portal", href: "/portal" },
              { label: "Dynamic Forms", href: "/portal/dynamic-client-forms-builder" },
              { label: form.title },
            ]}
          />
          <h1 className="cyber-heading mt-2 text-2xl">{form.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {form.form_type.replace(/_/g, " ")}
            {form.description && <span className="ml-2 text-slate-500">• {form.description}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {statusBadge(form.status)}
          {form.status === "published" && (
            <Link
              href={`/portal/dynamic-client-forms-builder/${form.id}/fill`}
              className="cyber-button"
            >
              Fill Form
            </Link>
          )}
        </div>
      </div>

      {isExpired && form.status === "published" && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
          This form has closed and is no longer accepting submissions.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Form Fields ({form.fields?.length ?? 0})</h2>
            {form.fields && form.fields.length > 0 ? (
              <div className="mt-4 space-y-3">
                {form.fields
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((field) => (
                    <div
                      key={field.key}
                      className="rounded-lg border border-white/5 bg-[#0A1118]/60 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-50">{field.label}</span>
                        {field.required && <span className="text-[10px] text-red-400">*</span>}
                        {fieldTypeBadge(field.type)}
                      </div>
                      {field.placeholder && (
                        <p className="mt-1 text-xs text-slate-500">
                          Placeholder: {field.placeholder}
                        </p>
                      )}
                      {field.helpText && (
                        <p className="mt-1 text-xs text-slate-400">{field.helpText}</p>
                      )}
                      {field.options && field.options.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {field.options.map((opt) => (
                            <span
                              key={opt}
                              className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No fields defined yet.</p>
            )}
          </section>

          {submissions.length > 0 && (
            <section className="cyber-panel">
              <h2 className="cyber-heading text-lg">Submissions ({submissions.length})</h2>
              <div className="mt-4 space-y-2">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-lg border border-white/5 bg-[#0A1118]/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-50">
                        {sub.respondent_email || "Anonymous"}
                      </span>
                      <span className="text-[11px] text-slate-400">{rel(sub.submitted_at)}</span>
                    </div>
                    <pre className="mt-2 max-h-24 overflow-auto text-xs text-slate-400">
                      {JSON.stringify(sub.answers, null, 2)}
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
                <dd className="text-slate-50">{form.form_type.replace(/_/g, " ")}</dd>
                <dt className="text-slate-400">Status</dt>
                <dd className="text-slate-50">{statusBadge(form.status)}</dd>
                <dt className="text-slate-400">Fields</dt>
                <dd className="text-slate-50">{form.fields?.length ?? 0}</dd>
                <dt className="text-slate-400">Submissions</dt>
                <dd className="text-slate-50">{submissions.length}</dd>
                <dt className="text-slate-400">Created</dt>
                <dd className="text-slate-50">{rel(form.created_at)}</dd>
                <dt className="text-slate-400">Updated</dt>
                <dd className="text-slate-50">{rel(form.updated_at)}</dd>
                {form.published_at && (
                  <>
                    <dt className="text-slate-400">Published</dt>
                    <dd className="text-slate-50">{rel(form.published_at)}</dd>
                  </>
                )}
                {form.closes_at && (
                  <>
                    <dt className="text-slate-400">Closes</dt>
                    <dd className={isExpired ? "text-red-400" : "text-slate-50"}>
                      {rel(form.closes_at)}
                    </dd>
                  </>
                )}
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
