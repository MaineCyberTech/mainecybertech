import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import { updateUserProfileBasics, updateMembership } from "./actions";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import PermissionsMatrix from "@/components/admin/PermissionsMatrix";

export const metadata = { title: "User Details - Admin - Maine CyberTech" };

type UserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserDetailPage({ params }: UserPageProps) {
  await requireAdminAccess();
  const { userId } = await params;
  const api = getApiClient();

  let detail: any;
  try {
    detail = await api.users.getDetail(userId);
  } catch {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        User not found.
      </div>
    );
  }

  const profile = detail.profile;
  const memberships = detail.memberships ?? [];
  const organizations = detail.organizations ?? [];
  const roles = detail.roles ?? [];
  const allRoles = detail.allRoles ?? [];

  const orgMap = new Map<string, any>(organizations.map((o: any) => [o.id, o]));
  const roleMap = new Map<string, any>(roles.map((r: any) => [r.id, r]));

  return (
    <AdminPageShell
      breadcrumbs={
        <AdminBreadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Users", href: "/admin/users" },
            { label: profile.full_name ?? "User Detail" }
          ]}
        />
      }
      subnav={<AdminSubnav current="users" />}
      title={profile.full_name ?? "User Detail"}
      description={profile.email ?? "No email"}
      actions={
        <Link href="/admin/users" className="cyber-button-secondary">
          Back to Users
        </Link>
      }
    >
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Profile</h2>

        <form action={updateUserProfileBasics} className="mt-6">
          <input type="hidden" name="userId" value={profile.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="cyber-label">Full Name</label>
              <input
                name="fullName"
                defaultValue={profile.full_name ?? ""}
                className="cyber-input"
              />
            </div>

            <div>
              <label className="cyber-label">Email</label>
              <input
                value={profile.email ?? ""}
                readOnly
                className="w-full rounded-lg border border-white/10 bg-[#0A1118]/40 px-4 py-3 text-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="cyber-label">Phone</label>
              <input
                name="phone"
                defaultValue={profile.phone ?? ""}
                className="cyber-input"
              />
            </div>

            <div>
              <label className="cyber-label">Title</label>
              <input
                name="title"
                defaultValue={profile.title ?? ""}
                className="cyber-input"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {profile.is_super_admin ? (
              <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                Super Admin
              </span>
            ) : null}

            {profile.default_organization_id ? (
              <span className="cyber-pill-success">
                Default Org: {profile.default_organization_id}
              </span>
            ) : null}
          </div>

          <div className="mt-6">
            <button type="submit" className="cyber-button">
              Save Profile
            </button>
          </div>
        </form>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Memberships</h2>

        <div className="mt-6 space-y-4">
          {memberships && memberships.length > 0 ? (
            memberships.map((membership: any) => {
              const org = orgMap.get(membership.organization_id);
              const role = roleMap.get(membership.role_id);

              return (
                <div
                  key={membership.id}
                  className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
                >
                  <div className="mb-4">
                    <p className="font-medium text-slate-50">
                      {org?.name ?? "Unknown Org"}
                    </p>
                    <p className="text-sm text-slate-400">
                      Current Role: {role?.name ?? "Unknown"} • Status: {membership.status}
                    </p>
                  </div>

                  <form action={updateMembership}>
                    <input type="hidden" name="membershipId" value={membership.id} />
                    <input type="hidden" name="userId" value={profile.id} />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="cyber-label">Role</label>
                        <select
                          name="roleId"
                          defaultValue={membership.role_id}
                          className="cyber-input"
                        >
                          {allRoles.map((r: any) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.key})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="cyber-label">Status</label>
                        <select
                          name="status"
                          defaultValue={membership.status}
                          className="cyber-input"
                        >
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                          <option value="suspended">suspended</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          name="isBillingContact"
                          defaultChecked={membership.is_billing_contact}
                        />
                        Billing Contact
                      </label>

                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          name="isSecurityContact"
                          defaultChecked={membership.is_security_contact}
                        />
                        Security Contact
                      </label>
                    </div>

                    <div className="mt-6">
                      <button type="submit" className="cyber-button-secondary">
                        Save Membership
                      </button>
                    </div>
                  </form>
                </div>
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
        <h2 className="cyber-heading text-lg">Permissions</h2>
        <p className="mt-2 text-sm text-slate-400">Role-based and individual permission overrides.</p>
        <PermissionsMatrix userId={userId} memberships={memberships} />
      </section>
    </AdminPageShell>
  );
}