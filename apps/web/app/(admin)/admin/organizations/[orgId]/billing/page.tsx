import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBillingClient from "./AdminBillingClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organization Billing - Admin - Maine CyberTech" };

type Props = { params: Promise<{ orgId: string }> };

export default async function AdminOrgBillingPage({ params }: Props) {
  await requireAdminAccess();
  const { orgId } = await params;
  const api = getApiClient();

  const [org, summary, subscriptions, invoices, payments, customer] = await Promise.all([
    api.organizations.get(orgId).catch(() => null),
    api.billing.summary({ organizationId: orgId }).catch(() => null),
    api.billing.listSubscriptions({ organizationId: orgId }).catch(() => []),
    api.billing.listInvoices({ organizationId: orgId, limit: 50 }).catch(() => ({ items: [] })),
    api.billing.listPayments({ organizationId: orgId, limit: 50 }).catch(() => ({ items: [] })),
    api.billing.getBillingCustomer({ organizationId: orgId }).catch(() => null),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">
            {org?.name ?? "Organization"} Billing
          </h1>
          <p className="mt-3 text-slate-400">
            View invoices, subscriptions, payments, and billing details.
          </p>
        </div>
        <Link
          href={`/admin/organizations/${orgId}`}
          className="rounded-lg border-2 border-emerald-600 bg-transparent px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-[0.18em] text-emerald-500 transition-all hover:bg-emerald-600/10"
        >
          Back to Organization
        </Link>
      </div>

      <AdminBillingClient
        summary={summary}
        subscriptions={subscriptions}
        invoices={invoices.items ?? []}
        payments={payments.items ?? []}
        customer={customer}
        organizationId={orgId}
      />
    </div>
  );
}
