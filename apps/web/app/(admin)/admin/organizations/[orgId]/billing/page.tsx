import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import DataErrorNote from "@/components/admin/DataErrorNote";
import AdminBillingClient from "./AdminBillingClient";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  return { title: `Organization Billing (${orgId.slice(0, 8)}) - Admin - Maine CyberTech` };
}

type Props = { params: Promise<{ orgId: string }> };

export default async function AdminOrgBillingPage({ params }: Props) {
  await requireAdminAccess();
  const { orgId } = await params;
  const api = getApiClient();

  let loadFailed = false;
  const fail = () => {
    loadFailed = true;
    return null;
  };
  const [org, summary, subscriptions, invoices, payments, customer] = await Promise.all([
    api.organizations.get(orgId).catch((error: unknown) => {
      if ((error as { status?: number })?.status === 404) notFound();
      return fail();
    }),
    api.billing.summary({ organizationId: orgId }).catch(fail),
    api.billing.listSubscriptions({ organizationId: orgId }).catch(() => {
      loadFailed = true;
      return [];
    }),
    api.billing.listInvoices({ organizationId: orgId, limit: 50 }).catch(() => {
      loadFailed = true;
      return { items: [] };
    }),
    api.billing.listPayments({ organizationId: orgId, limit: 50 }).catch(() => {
      loadFailed = true;
      return { items: [] };
    }),
    api.billing.getBillingCustomer({ organizationId: orgId }).catch(fail),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-[0.14em] text-slate-50">
            {org?.name ?? "Organization"} Billing
          </h1>
          <p className="mt-3 text-slate-400">
            View invoices, subscriptions, payments, and billing details.
          </p>
        </div>
        <Link
          href={`/admin/organizations/${orgId}`}
          className="rounded-lg border-2 border-emerald-600 bg-transparent px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.18em] text-emerald-500 transition-all hover:bg-emerald-600/10"
        >
          Back to Organization
        </Link>
      </div>

      {loadFailed && <DataErrorNote what="billing data" />}

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
