import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DataErrorNote from "@/components/admin/DataErrorNote";
import EmptyState from "@/components/EmptyState";
import { getApiClient } from "@/lib/api";
import Link from "next/link";
import type { StoreProposalDraft, StoreQuoteRequest } from "@mct/sdk";
import { GenerateProposalDraftButton, ProposalDraftStatusForm } from "./ProposalDraftActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quote Requests - Store - Admin - Maine CyberTech" };

function customerName(customer: StoreQuoteRequest["customer"]): string {
  const name = (customer as { name?: unknown })?.name;
  return typeof name === "string" && name ? name : "Unknown customer";
}

function customerEmail(customer: StoreQuoteRequest["customer"]): string {
  const email = (customer as { email?: unknown })?.email;
  return typeof email === "string" && email ? email : "—";
}

function itemLabels(items: unknown[]): string[] {
  return (items ?? []).map((item) => {
    if (typeof item === "string") return item;
    const named = item as { name?: unknown; productId?: unknown };
    return String(named?.name ?? named?.productId ?? "Service");
  });
}

export default async function AdminStoreQuoteRequestsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let requests: StoreQuoteRequest[] = [];
  let drafts: StoreProposalDraft[] = [];
  let loadFailed = false;

  const [requestsResult, draftsResult] = await Promise.allSettled([
    api.store.listQuoteRequests(),
    api.store.listProposalDrafts(),
  ]);
  if (requestsResult.status === "fulfilled") requests = requestsResult.value;
  else loadFailed = true;
  if (draftsResult.status === "fulfilled") drafts = draftsResult.value;
  else loadFailed = true;

  const draftsByRequest = new Map<string, StoreProposalDraft[]>();
  for (const draft of drafts) {
    const key = draft.quote_request_id ?? "unlinked";
    draftsByRequest.set(key, [...(draftsByRequest.get(key) ?? []), draft]);
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Quote Requests" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-quote-requests" />}
      title="Structured Quote Requests"
      description={`${requests.length} request${requests.length === 1 ? "" : "s"} · ${drafts.length} proposal draft${drafts.length === 1 ? "" : "s"}`}
    >
      {loadFailed && <DataErrorNote what="quote requests" />}

      {requests.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No quote requests yet"
          description="Structured quote requests are captured when a customer submits the public quote builder."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const requestDrafts = draftsByRequest.get(request.id) ?? [];
            return (
              <section
                key={request.id}
                className="rounded-lg border border-white/10 bg-cyber-base/60 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-50">{customerName(request.customer)}</p>
                    <p className="text-xs text-slate-400">{customerEmail(request.customer)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {itemLabels(request.items).join(", ") || "No items"} ·{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                      {request.status.replace(/_/g, " ")}
                    </span>
                    <GenerateProposalDraftButton quoteRequestId={request.id} />
                  </div>
                </div>

                {request.notes && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{request.notes}</p>
                )}

                {requestDrafts.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Proposal drafts
                    </p>
                    {requestDrafts.map((draft) => (
                      <div
                        key={draft.id}
                        className="flex flex-wrap items-center justify-between gap-3"
                      >
                        <span className="font-mono text-xs text-slate-400">
                          {draft.id.slice(0, 8)} · {new Date(draft.created_at).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-3">
                          {draft.proposal_id && (
                            <Link
                              href={`/admin/proposals/${draft.proposal_id}`}
                              className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
                            >
                              Open proposal →
                            </Link>
                          )}
                          <ProposalDraftStatusForm
                            draftId={draft.id}
                            status={String(draft.status)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </AdminPageShell>
  );
}
