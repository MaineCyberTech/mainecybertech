import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor Contacts - Portal - Maine CyberTech" };

export default async function PortalVendorContactsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.vendors.contacts.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Vendor Contacts">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Vendor Contacts" }]}
      />
      <PortalSubnav current="vendor-contacts" />
      <h1 className="text-2xl font-semibold text-slate-50">Vendor Contacts</h1>
      <p className="text-sm text-slate-400">{items.length} contacts for your organization.</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">
                  {String(item.contact_name ?? "Unknown")}
                  {item.is_primary ? (
                    <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                      Primary
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-slate-400">Vendor: {String(item.vendor_name)}</p>
                {item.role_title ? (
                  <p className="mt-1 text-xs text-slate-400">Role: {String(item.role_title)}</p>
                ) : null}
                {item.email ? (
                  <p className="mt-1 text-xs text-slate-400">Email: {String(item.email)}</p>
                ) : null}
                {item.phone ? (
                  <p className="mt-1 text-xs text-slate-400">Phone: {String(item.phone)}</p>
                ) : null}
                {item.account_number ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Account #: {String(item.account_number)}
                  </p>
                ) : null}
                {item.support_portal_url ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Support Portal:{" "}
                    <a
                      href={String(item.support_portal_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-500 underline hover:text-emerald-400"
                    >
                      Open Link
                    </a>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No vendor contacts found.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
