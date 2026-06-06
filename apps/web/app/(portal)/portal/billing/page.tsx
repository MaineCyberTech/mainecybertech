import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import BillingPageClient from "./BillingPageClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Billing - Portal - Maine CyberTech" };

export default async function PortalBillingPage() {
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) {
    return (
      <div className="space-y-6">
        <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Billing" }]} />
        <PortalSubnav current="billing" />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">Access restricted.</div>
      </div>
    );
  }

  const [summary, subscriptions, invoices, customer] = await Promise.all([
    api.billing.summary({ organizationId: membership.organization_id }).catch(() => null),
    api.billing.listSubscriptions({ organizationId: membership.organization_id }).catch(() => []),
    api.billing.listInvoices({ organizationId: membership.organization_id, limit: 50 }).catch(() => null),
    api.billing.getBillingCustomer({ organizationId: membership.organization_id }).catch(() => null),
  ]);

  return (
    <div className="space-y-6">
      <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Billing" }]} />
      <PortalSubnav current="billing" />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Billing</h1>
          <p className="mt-3 text-slate-400">View invoices, subscriptions, and payment history.</p>
        </div>
      </div>

      <BillingPageClient
        summary={summary}
        subscriptions={subscriptions}
        invoices={invoices?.items ?? []}
        customer={customer}
      />
    </div>
  );
}
