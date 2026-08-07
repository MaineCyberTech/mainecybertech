import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import CrudForm from "@/components/admin/CrudForm";
import { createVendorContact } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor Contacts - Admin - Maine CyberTech" };

export default async function VendorContactsPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let contacts: Array<{
    id: string;
    vendor_name: string;
    contact_name: string | null;
    role_title: string | null;
    email: string | null;
    phone: string | null;
    is_primary: boolean;
  }> = [];
  try {
    const r = await api.vendors.contacts.list({});
    contacts = r.items as typeof contacts;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Vendor Contacts" }]} />
      }
      subnav={<AdminSubnav current="vendor-contacts" />}
      title="Vendor Contact Escalation Directory"
      description="Centralized vendor contacts, support portals, account IDs, and escalation paths."
      actions={null}
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "vendorName", label: "Vendor", required: true },
          { key: "contactName", label: "Contact", required: true },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
        ]}
        title="New Vendor Contact"
        action={createVendorContact}
      />
      <section className="cyber-panel">
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {contacts.length > 0 ? (
            contacts.map((c) => (
              <Link
                key={c.id}
                href={`/admin/vendor-contacts/${c.id}`}
                className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
              >
                <p className="font-medium text-slate-50">
                  {c.contact_name || "Unknown Contact"}{" "}
                  {c.is_primary && <span className="text-xs text-amber-400">(Primary)</span>}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {c.vendor_name} &bull; {c.role_title || "—"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {c.email || "—"} &bull; {c.phone || "—"}
                </p>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="📞"
              title="No vendor contacts"
              description="Add vendor support contacts and escalation paths."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
