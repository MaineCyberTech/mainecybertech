import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import SatisfactionPulseRespondForm from "./SatisfactionPulseRespondForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Satisfaction Pulse Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.satisfactionPulse.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Satisfaction Pulse", href: "/admin/satisfaction-pulse" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="satisfaction-pulse" />}
      title={String(record?.subject ?? "Pulse Detail")}
    >
      {record && (
        <SatisfactionPulseRespondForm
          id={id}
          organizationId={String(record.organization_id)}
          status={String(record.status ?? "pending")}
          rating={Number(record.rating ?? 5)}
        />
      )}
      <section className="cyber-panel mt-4">
        <h2 className="cyber-heading text-lg">Details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="text-slate-400">Question</dt>
            <dd className="text-slate-50">{String(record?.question ?? "—")}</dd>
            <dt className="text-slate-400">Status</dt>
            <dd className="text-slate-50">{String(record?.status ?? "—")}</dd>
            <dt className="text-slate-400">Source</dt>
            <dd className="text-slate-50">{String(record?.source ?? "—")}</dd>
            <dt className="text-slate-400">Rating</dt>
            <dd className="text-slate-50">{String(record?.rating ?? "—")}</dd>
            <dt className="text-slate-400">Feedback</dt>
            <dd className="text-slate-50">{String(record?.feedback ?? "—")}</dd>
            <dt className="text-slate-400">Sent</dt>
            <dd className="text-slate-50">
              {record?.sent_at ? new Date(String(record.sent_at)).toISOString().slice(0, 16) : "—"}
            </dd>
            <dt className="text-slate-400">Responded</dt>
            <dd className="text-slate-50">
              {record?.responded_at
                ? new Date(String(record.responded_at)).toISOString().slice(0, 16)
                : "—"}
            </dd>
          </div>
        </dl>
      </section>
      <Link
        href="/admin/satisfaction-pulse"
        className="mt-4 inline-block text-sm text-emerald-500 hover:text-emerald-400"
      >
        &larr; Back to Satisfaction Pulse
      </Link>
    </AdminPageShell>
  );
}
