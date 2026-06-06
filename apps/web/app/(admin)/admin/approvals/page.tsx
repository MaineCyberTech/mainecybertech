import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import {
  approveOrganization,
  rejectOrganization,
  approveMembership,
  rejectMembership
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approvals - Admin - Maine CyberTech" };

export default async function ApprovalQueuePage() {
  await requireAdminAccess();
  const api = getApiClient();

  const pendingOrganizations = await api.organizations.list({ status: "pending" });
  const pendingMemberships = await api.memberships.list({ status: "pending" });

  const orgIds = pendingMemberships.map((m: any) => m.organization_id).filter(Boolean);
  const userIds = pendingMemberships.map((m: any) => m.user_id).filter(Boolean);

  const [orgs, profiles] = await Promise.all([
    orgIds.length ? api.organizations.list({ ids: orgIds }) : Promise.resolve([] as any[]),
    userIds.length ? api.profiles.list({ ids: userIds }) : Promise.resolve([] as any[]),
  ]);

  const orgMap = new Map(orgs.map((o: any) => [o.id, o]));
  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  return (
    <AdminPageShell
      breadcrumbs={
        <AdminBreadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Approvals" }
          ]}
        />
      }
      subnav={<AdminSubnav current="approvals" />}
      title="Approval Queue"
      description="Review pending organizations and user memberships."
      actions={
        <div className="flex flex-wrap gap-2">
            <div className="cyber-pill">
            Pending Orgs: {pendingOrganizations.length}
          </div>
          <div className="cyber-pill">
            Pending Users: {pendingMemberships.length}
          </div>
        </div>
      }
    >
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Pending Organizations</h2>

        <div className="mt-6 space-y-4">
          {pendingOrganizations.length > 0 ? (
            pendingOrganizations.map((org: any) => (
              <div
                key={org.id}
                className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-slate-50">{org.name}</p>
                    <p className="text-sm text-slate-400">
                      Slug: {org.slug} &bull; Domain: {org.primary_domain ?? "&mdash;"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <form action={approveOrganization}>
                      <input type="hidden" name="organizationId" value={org.id} />
                      <button type="submit" className="cyber-button">
                        Approve Org
                      </button>
                    </form>

                    <form action={rejectOrganization}>
                      <input type="hidden" name="organizationId" value={org.id} />
                      <button type="submit" className="cyber-button-secondary">
                        Reject Org
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
              No pending organizations.
            </div>
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Pending Memberships</h2>

        <div className="mt-6 space-y-4">
          {pendingMemberships.length > 0 ? (
            pendingMemberships.map((membership: any) => {
              const profile = profileMap.get(membership.user_id);
              const org = orgMap.get(membership.organization_id);
              return (
              <div
                key={membership.id}
                className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-slate-50">
                      {profile?.full_name ?? "Unknown User"}
                    </p>
                    <p className="text-sm text-slate-400">
                      {profile?.email ?? "No email"} &bull; Org:{" "}
                      {org?.name ?? "Unknown Org"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <form action={approveMembership}>
                      <input type="hidden" name="membershipId" value={membership.id} />
                      <button type="submit" className="cyber-button">
                        Approve User
                      </button>
                    </form>

                    <form action={rejectMembership}>
                      <input type="hidden" name="membershipId" value={membership.id} />
                      <button type="submit" className="cyber-button-secondary">
                        Reject User
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
            })
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
              No pending memberships.
            </div>
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
