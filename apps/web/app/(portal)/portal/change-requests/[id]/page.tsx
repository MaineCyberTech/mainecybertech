import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { withRetry } from "@/lib/retry";
import { hasPermission } from "@/lib/permissions";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";
import { formatDate, formatDateTime, formatRelativeTime } from "@/lib/format";
import SubmitChangeButton from "./SubmitChangeButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Change Request (${id.slice(0, 8)}) - Portal - Maine CyberTech` };
}

type ChangeRecord = {
  id: string;
  title: string;
  description: string | null;
  change_type: string;
  risk_level: string;
  rollback_plan: string | null;
  implementation_date: string | null;
  verification_steps: string | null;
  status?: string;
  submitted_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  implemented_at?: string | null;
  verified_at?: string | null;
  created_at: string;
};

const LIFECYCLE = [
  { key: "draft", label: "Draft" },
  { key: "pending_review", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "implemented", label: "Implemented" },
  { key: "verified", label: "Verified" },
];

export default async function ChangeRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) notFound();

  const api = getApiClient();
  let change: ChangeRecord | null = null;
  try {
    change = (await withRetry(() => api.governance.changes.get(id))) as unknown as ChangeRecord;
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }
  if (!change) notFound();

  const permissions = await Promise.resolve()
    .then(() => api.permissions.getMyPermissions())
    .catch(() => null);
  const canSubmit =
    Boolean(permissions?.isSuperAdmin) || hasPermission(permissions?.keys, "governance", "edit");
  const status = change.status ?? "draft";

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Change Requests", href: "/portal/change-requests" },
          { label: change.title },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">{change.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {change.change_type} change • {change.risk_level} risk • created{" "}
            {formatRelativeTime(change.created_at)}
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Lifecycle</h2>
        <ol className="mt-4 flex flex-wrap gap-2">
          {LIFECYCLE.map((step) => {
            const index = LIFECYCLE.findIndex((item) => item.key === status);
            const stepIndex = LIFECYCLE.findIndex((item) => item.key === step.key);
            const complete = index >= 0 && stepIndex <= index;
            return (
              <li
                key={step.key}
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  complete
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                    : "border-white/10 bg-white/5 text-slate-500"
                }`}
              >
                {step.label}
              </li>
            );
          })}
          {status === "rejected" ? (
            <li className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-300">
              Rejected
            </li>
          ) : null}
        </ol>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {change.description ? (
          <section className="cyber-panel md:col-span-2">
            <h2 className="cyber-heading text-lg">Description</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {change.description}
            </p>
          </section>
        ) : null}
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Rollback plan</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {change.rollback_plan || "No rollback plan provided."}
          </p>
        </section>
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Verification</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {change.verification_steps || "No verification steps provided."}
          </p>
        </section>
      </div>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Dates</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Planned</dt>
            <dd className="mt-1 text-slate-200">{formatDate(change.implementation_date)}</dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Submitted</dt>
            <dd className="mt-1 text-slate-200">{formatDateTime(change.submitted_at)}</dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Approved</dt>
            <dd className="mt-1 text-slate-200">{formatDateTime(change.approved_at)}</dd>
          </div>
        </dl>
      </section>

      {status === "draft" && canSubmit ? <SubmitChangeButton id={change.id} /> : null}

      <Link href="/portal/change-requests" className="cyber-button-secondary">
        Back to change requests
      </Link>
    </div>
  );
}
