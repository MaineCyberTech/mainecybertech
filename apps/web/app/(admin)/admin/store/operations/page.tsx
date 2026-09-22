import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DataErrorNote from "@/components/admin/DataErrorNote";
import EmptyState from "@/components/EmptyState";
import { getApiClient } from "@/lib/api";
import { getIntakeToProjectData } from "@/lib/catalog/v5-loaders";
import type { StoreQuoteRequest } from "@mct/sdk";
import ConvertIntakeForm from "./ConvertIntakeForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake-to-Project Ops - Store - Admin - Maine CyberTech" };

function customerName(customer: StoreQuoteRequest["customer"]): string {
  const name = (customer as { name?: unknown })?.name;
  return typeof name === "string" && name ? name : "Unknown customer";
}

function itemLabels(items: unknown[]): string[] {
  return (items ?? []).map((item) => {
    if (typeof item === "string") return item;
    const named = item as { name?: unknown; productId?: unknown };
    return String(named?.name ?? named?.productId ?? "Service");
  });
}

export default async function AdminStoreOperationsPage() {
  await requireAdminAccess();
  const data = getIntakeToProjectData();

  let requests: StoreQuoteRequest[] = [];
  let loadFailed = false;
  try {
    requests = await getApiClient().store.listQuoteRequests();
  } catch {
    loadFailed = true;
  }

  const pending = requests.filter((r) => r.status !== "converted_to_project");
  const converted = requests.filter((r) => r.status === "converted_to_project");

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Intake-to-Project Operations" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-operations" />}
      title="Intake-to-Project Operations"
      description={`${pending.length} request${pending.length === 1 ? "" : "s"} awaiting handoff · ${converted.length} converted`}
    >
      {loadFailed && <DataErrorNote what="intake queue" />}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Awaiting Handoff</h2>
        {pending.length === 0 ? (
          <EmptyState
            icon="🚀"
            title="Nothing awaiting handoff"
            description="New store quote requests appear here to be converted into projects."
          />
        ) : (
          <div className="space-y-4">
            {pending.map((request) => (
              <section
                key={request.id}
                className="rounded-lg border border-white/10 bg-cyber-base/60 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-50">{customerName(request.customer)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {itemLabels(request.items).join(", ") || "No items"} ·{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    {request.status.replace(/_/g, " ")}
                  </span>
                </div>
                <ConvertIntakeForm quoteRequestId={request.id} />
              </section>
            ))}
          </div>
        )}
      </section>

      {converted.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Converted ({converted.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {converted.map((request) => (
              <span
                key={request.id}
                className="rounded border border-emerald-600/20 bg-emerald-600/10 px-3 py-1.5 text-xs text-emerald-400"
              >
                {customerName(request.customer)}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Entity Objects ({data.entities.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.entities.map((obj) => (
            <span
              key={obj}
              className="rounded border border-white/10 bg-cyber-base/60 px-3 py-1.5 font-mono text-xs text-slate-300"
            >
              {obj}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Status Map</h2>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <pre className="text-xs text-slate-400">
            {JSON.stringify(data.statusMap, null, 2) || "{}"}
          </pre>
        </div>
      </section>
    </AdminPageShell>
  );
}
