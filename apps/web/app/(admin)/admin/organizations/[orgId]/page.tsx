import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import OrgBrandingForm from "@/components/admin/OrgBrandingForm";
import AdminDocUpload from "@/components/admin/AdminDocUpload";
import {
  updateOrganizationBasics,
  createOrganizationDomain,
  updateOrganizationDomain
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organization Details - Admin - Maine CyberTech" };

type OrgPageProps = {
  params: Promise<{
    orgId: string;
  }>;
};

export default async function OrganizationDetailPage({ params }: OrgPageProps) {
  await requireAdminAccess();
  const { orgId } = await params;
  const api = getApiClient();

  let detail: any;
  try {
    detail = await api.organizations.getDetail(orgId);
  } catch {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        Organization not found.
      </div>
    );
  }

  const org = detail.organization;
  const domains = detail.domains ?? [];
  const memberships = detail.memberships ?? [];
  const profiles = detail.profiles ?? [];
  const roles = detail.roles ?? [];

  const profileMap = new Map<string, any>(profiles.map((p: any) => [p.id, p]));
  const roleMap = new Map<string, any>(roles.map((r: any) => [r.id, r]));

  return (
    <AdminPageShell
      breadcrumbs={
        <AdminBreadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Organizations", href: "/admin/organizations" },
            { label: org.name }
          ]}
        />
      }
      subnav={<AdminSubnav current="organizations" />}
      title={org.name}
      description="Manage org metadata, domains, and memberships."
      actions={
        <Link href="/admin/organizations" className="cyber-button-secondary">
          Back to Organizations
        </Link>
      }
    >
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Organization Basics</h2>

        <form action={updateOrganizationBasics} className="mt-6 space-y-6">
          <input type="hidden" name="organizationId" value={org.id} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="cyber-label">Name</label>
              <input
                name="name"
                defaultValue={org.name}
                className="cyber-input"
              />
            </div>

            <div>
              <label className="cyber-label">Slug</label>
              <input
                name="slug"
                defaultValue={org.slug}
                className="cyber-input"
              />
            </div>

            <div>
              <label className="cyber-label">Status</label>
              <select
                name="status"
                defaultValue={org.status}
                className="cyber-input"
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="suspended">suspended</option>
              </select>
            </div>

            <div>
              <label className="cyber-label">Primary Domain</label>
              <input
                name="primaryDomain"
                defaultValue={org.primary_domain ?? ""}
                className="cyber-input"
              />
            </div>

            <div>
              <label className="cyber-label">Support Plan</label>
              <input
                name="supportPlan"
                defaultValue={org.support_plan ?? ""}
                className="cyber-input"
              />
            </div>
          </div>

          <div>
            <button type="submit" className="cyber-button">
              Save Organization
            </button>
          </div>
        </form>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Domains</h2>

        <div className="mt-6 space-y-4">
          {domains && domains.length > 0 ? (
            domains.map((domain: any) => (
              <div
                key={domain.id}
                className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-slate-50">{domain.domain}</p>
                    <p className="text-sm text-slate-400">
                      Auto-approve: {domain.auto_approve ? "Enabled" : "Disabled"}
                    </p>
                  </div>

                  <form action={updateOrganizationDomain} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input type="hidden" name="organizationId" value={org.id} />
                    <input type="hidden" name="domainId" value={domain.id} />

                    <select
                      name="autoApprove"
                      defaultValue={domain.auto_approve ? "true" : "false"}
                      className="cyber-input min-w-[180px]"
                    >
                      <option value="true">Auto-approve</option>
                      <option value="false">Manual approval</option>
                    </select>

                    <button type="submit" className="cyber-button-secondary">
                      Save Domain
                    </button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
              No domains configured.
            </div>
          )}
        </div>

        <form action={createOrganizationDomain} className="mt-6 space-y-4">
          <input type="hidden" name="organizationId" value={org.id} />

          <div className="grid gap-4 md:grid-cols-[1fr,220px,auto]">
            <input
              name="domain"
              placeholder="example.com"
              className="cyber-input"
            />

            <select
              name="autoApprove"
              defaultValue="false"
              className="cyber-input"
            >
              <option value="false">Manual approval</option>
              <option value="true">Auto-approve</option>
            </select>

            <button type="submit" className="cyber-button">
              Add Domain
            </button>
          </div>
        </form>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Memberships</h2>

        <div className="mt-6 space-y-4">
          {memberships && memberships.length > 0 ? (
            memberships.map((membership: any) => {
              const profile = profileMap.get(membership.user_id);
              const role = roleMap.get(membership.role_id);

              return (
                <Link
                  key={membership.id}
                  href={`/admin/users/${membership.user_id}`}
                  className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-600/20 hover:bg-[#0A1118]/80"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium text-slate-50">
                        {profile?.full_name ?? "Unknown User"}
                      </p>
                      <p className="text-sm text-slate-400">
                        {profile?.email ?? "No email"} • Role: {role?.name ?? "Unknown"} • Status: {membership.status}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {membership.is_billing_contact ? (
                        <span className="cyber-pill-success">Billing Contact</span>
                      ) : null}
                      {membership.is_security_contact ? (
                        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-300">
                          Security Contact
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
              No memberships found.
            </div>
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="cyber-heading text-lg">Billing &amp; Payments</h2>
            <p className="mt-1 text-sm text-slate-400">View invoices, subscriptions, and payment history.</p>
          </div>
          <Link href={`/admin/organizations/${org.id}/billing`} className="rounded-lg border-2 border-emerald-600 bg-transparent px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-[0.18em] text-emerald-500 transition-all hover:bg-emerald-600/10">
            View Billing
          </Link>
        </div>
      </section>

      <section className="cyber-panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="cyber-heading text-lg">Documents</h2>
            <p className="mt-1 text-sm text-slate-400">Upload a document for this organization.</p>
          </div>
          <Link href="/admin/documents" className="rounded-lg border-2 border-emerald-600 bg-transparent px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-[0.18em] text-emerald-500 transition-all hover:bg-emerald-600/10">
            All Documents
          </Link>
        </div>
        <div className="mt-6">
          <AdminDocUpload organizationId={org.id} />
        </div>
      </section>

      <OrgBrandingForm
        organizationId={org.id}
        initialLogoUrl={org.logo_url}
        initialBrandColor={org.brand_color}
        initialAccentColor={org.accent_color}
        initialCustomDomain={org.custom_domain}
      />
    </AdminPageShell>
  );
}