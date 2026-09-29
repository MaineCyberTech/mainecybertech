import Link from "next/link";
import type { Metadata } from "next";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DataErrorNote from "@/components/admin/DataErrorNote";
import EmptyState from "@/components/EmptyState";
import { formatDateTime } from "@/lib/format";
import type { WebhookDeadLetter } from "@mct/sdk";
import DeadLetterActions from "./DeadLetterActions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Webhook Dead Letters - Admin - Maine CyberTech" };
}

function truncateError(value: string | null | undefined, max = 80): string {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export default async function AdminWebhookDeadLettersPage() {
  await requireAdminAccess();
  await requirePermission("webhooks", "view");

  let deadLetters: WebhookDeadLetter[] = [];
  let loadFailed = false;
  try {
    const result = await getApiClient().webhooks.listDeadLetters({ limit: 50 });
    deadLetters = result.items;
  } catch (error) {
    console.error("[[dead-letters]/page]", error);
    loadFailed = true;
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Webhooks", href: "/admin/webhooks" },
            { label: "Dead Letters" },
          ]}
        />
      }
      subnav={<AdminSubnav current="webhooks" />}
      title="Dead-Letter Deliveries"
      description="Webhook deliveries that exhausted their retries. Retry one to replay it through the delivery queue, or dismiss it to remove it."
      actions={
        <Link href="/admin/webhooks" className="cyber-button-secondary">
          Back to Webhooks
        </Link>
      }
    >
      {loadFailed ? <DataErrorNote what="dead-letter deliveries" /> : null}

      {!loadFailed && deadLetters.length === 0 ? (
        <EmptyState
          icon="⚠️"
          title="No dead-letter deliveries."
          description="Failed webhook deliveries that exhaust their retries will appear here."
        />
      ) : null}

      {!loadFailed && deadLetters.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-cyber-base/60">
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-300">
                  Event
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-300">
                  Endpoint
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-300">
                  Attempts
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-300">
                  Last error
                </th>
                <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-300">
                  Last attempt
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {deadLetters.map((deadLetter) => (
                <tr key={deadLetter.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-50">{deadLetter.event}</span>
                  </td>
                  <td className="px-4 py-3">
                    {deadLetter.endpoint ? (
                      <>
                        <span className="block text-slate-200">{deadLetter.endpoint.name}</span>
                        <span className="block max-w-xs truncate font-mono text-[11px] text-slate-500">
                          {deadLetter.endpoint.url}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono text-[11px] text-slate-500">
                        {deadLetter.webhook_id}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{deadLetter.attempt_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className="block max-w-xs truncate text-slate-400"
                      title={deadLetter.last_error ?? undefined}
                    >
                      {truncateError(deadLetter.last_error)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDateTime(deadLetter.last_attempt_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeadLetterActions id={deadLetter.id} event={deadLetter.event} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
