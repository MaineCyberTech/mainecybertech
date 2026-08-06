import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import ApprovalWorkflowActions from "./ApprovalWorkflowActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approval Request Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  let timeline: unknown[] = [];
  try {
    record = (await api.approvals.get(id)) as unknown as Record<string, unknown>;
  } catch {}
  try {
    timeline = await api.approvals.getTimeline(id);
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Approval Requests", href: "/admin/approval-requests" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="approvals" />}
      title={String(record?.request_subject ?? "Approval Request")}
    >
      {record && (
        <ApprovalWorkflowActions
          id={id}
          organizationId={String(record.organization_id)}
          status={String(record.status ?? "pending")}
        />
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Request</h2>
            <p className="mt-2 text-sm text-slate-400">
              {String(record?.request_body ?? "No details provided.")}
            </p>
            {record?.request_metadata != null && (
              <pre className="mt-3 max-h-48 overflow-auto rounded-lg border border-white/5 bg-[#0A1118]/60 p-3 text-xs text-slate-400">
                {JSON.stringify(record.request_metadata, null, 2)}
              </pre>
            )}
          </section>
          {timeline.length > 0 && (
            <section className="cyber-panel">
              <h2 className="cyber-heading text-lg">Timeline</h2>
              <div className="mt-4 space-y-2">
                {timeline.map((ev, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-white/5 bg-[#0A1118]/60 p-3 text-sm"
                  >
                    <span className="text-slate-50">
                      {(ev as Record<string, unknown>).action
                        ? String((ev as Record<string, unknown>).action)
                        : "Event"}
                    </span>
                    {(ev as Record<string, unknown>).created_at != null && (
                      <span className="ml-2 text-xs text-slate-500">
                        {new Date(String((ev as Record<string, unknown>).created_at))
                          .toISOString()
                          .slice(0, 16)}
                      </span>
                    )}
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
                <dd className="text-slate-50">{String(record?.request_type ?? "—")}</dd>
                <dt className="text-slate-400">Status</dt>
                <dd className="text-slate-50">{String(record?.status ?? "—")}</dd>
                <dt className="text-slate-400">Priority</dt>
                <dd className="text-slate-50">{String(record?.priority ?? "—")}</dd>
                <dt className="text-slate-400">Source</dt>
                <dd className="text-slate-50">{String(record?.source_module ?? "—")}</dd>
                <dt className="text-slate-400">Visibility</dt>
                <dd className="text-slate-50">{String(record?.visibility ?? "—")}</dd>
                {record?.due_at != null && (
                  <>
                    <dt className="text-slate-400">Due</dt>
                    <dd className="text-slate-50">
                      {new Date(String(record.due_at)).toISOString().slice(0, 10)}
                    </dd>
                  </>
                )}
                <dt className="text-slate-400">Created</dt>
                <dd className="text-slate-50">
                  {record?.created_at
                    ? new Date(String(record.created_at)).toISOString().slice(0, 10)
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </AdminPageShell>
  );
}
