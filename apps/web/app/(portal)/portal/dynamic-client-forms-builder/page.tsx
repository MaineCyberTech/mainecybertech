import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export const metadata = { title: "Dynamic Forms - Portal - Maine CyberTech" };
export const dynamic = "force-dynamic";

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
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${styles[status] || "border-white/10 bg-white/5 text-slate-300"}`}
    >
      {status}
    </span>
  );
}

function formTypeBadge(formType: string) {
  const styles: Record<string, string> = {
    intake: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    survey: "border-purple-500/25 bg-purple-500/10 text-purple-300",
    questionnaire: "border-indigo-500/25 bg-indigo-500/10 text-indigo-300",
    access_request: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    incident_report: "border-red-500/25 bg-red-500/10 text-red-300",
    approval: "border-teal-500/25 bg-teal-500/10 text-teal-300",
  };
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${styles[formType] || "border-white/10 bg-white/5 text-slate-300"}`}
    >
      {formType.replace(/_/g, " ")}
    </span>
  );
}

export default async function DynamicFormsListPage() {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Portal", href: "/portal" }, { label: "Dynamic Forms" }]} />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">
          Access restricted. Please contact your administrator.
        </div>
      </div>
    );
  }

  const api = getApiClient();
  const orgId = membership.organization_id as string;

  let forms: Array<{
    id: string;
    title: string;
    description: string | null;
    form_type: string;
    status: string;
    fields: unknown[];
    published_at: string | null;
    closes_at: string | null;
    created_at: string;
  }> = [];

  try {
    const result = await api.dynamicForms.list({ organizationId: orgId, limit: 50, page: 1 });
    forms = result?.items ?? [];
  } catch {
    // Gracefully handle errors
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Breadcrumbs items={[{ label: "Portal", href: "/portal" }, { label: "Dynamic Forms" }]} />
          <h1 className="cyber-heading mt-2 text-2xl">Dynamic Client Forms Builder</h1>
          <p className="mt-1 text-sm text-slate-400">
            No-code form builder for client intake forms, onboarding questionnaires, site surveys,
            access requests, and more.
          </p>
        </div>
        <Link href="/portal/dynamic-client-forms-builder/new" className="cyber-button">
          New Form
        </Link>
      </div>

      {forms.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {forms.map((form) => (
            <Link
              key={form.id}
              href={`/portal/dynamic-client-forms-builder/${form.id}`}
              className="cyber-panel block p-5 transition hover:border-emerald-500/30 hover:bg-cyber-base/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-50">{form.title}</p>
                  {form.description && (
                    <p className="mt-1 truncate text-xs text-slate-400">{form.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {statusBadge(form.status)}
                {formTypeBadge(form.form_type)}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>{form.fields?.length ?? 0} fields</span>
                {form.published_at && <span>Published {rel(form.published_at)}</span>}
              </div>
              {form.closes_at && (
                <div className="mt-2 text-xs text-amber-400">Closes {rel(form.closes_at)}</div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-slate-500">
                <span>Created {rel(form.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📝"
          title="No forms yet"
          description="Create your first dynamic form to collect client intake data, site survey responses, access requests, and more."
          actionLabel="Create Form"
          actionHref="/portal/dynamic-client-forms-builder/new"
        />
      )}
    </div>
  );
}
