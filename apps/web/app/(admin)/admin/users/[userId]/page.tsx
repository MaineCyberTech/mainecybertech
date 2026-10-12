import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { updateUserProfileBasics } from "./actions";
import MembershipForm from "./MembershipForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import UserPermissionOverridesClient from "@/components/admin/UserPermissionOverridesClient";
import SubmitButton from "@/components/SubmitButton";
import { Membership, Organization, Role, UserDetail } from "@mct/sdk";

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return { title: `User Details (${userId.slice(0, 8)}) - Admin - Maine CyberTech` };
}

type UserPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function UserDetailPage({ params }: UserPageProps) {
  await requireAdminAccess();
  await requirePermission("users", "view");
  const { userId } = await params;
  const api = getApiClient();

  let detail: UserDetail;
  try {
    detail = await api.users.getDetail(userId);
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  const profile = detail.profile!;
  const memberships = detail.memberships ?? [];
  const organizations = detail.organizations ?? [];
  const roles = detail.roles ?? [];
  const allRoles = detail.allRoles ?? [];

  const orgMap = new Map<string, Organization>(organizations.map((o: Organization) => [o.id, o]));
  const roleMap = new Map<string, Role>(roles.map((r: Role) => [r.id, r]));

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Users", href: "/admin/users" },
            { label: profile.full_name ?? "User Detail" },
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
              <label htmlFor="user-fullName" className="cyber-label">
                Full Name
              </label>
              <input
                id="user-fullName"
                name="fullName"
                defaultValue={profile.full_name ?? ""}
                className="cyber-input"
              />
            </div>

            <div>
              <label htmlFor="user-email" className="cyber-label">
                Email
              </label>
              <input
                id="user-email"
                value={profile.email ?? ""}
                readOnly
                className="w-full rounded-lg border border-white/10 bg-cyber-base/40 px-4 py-3 text-slate-400 outline-none"
              />
            </div>

            <div>
              <label htmlFor="user-phone" className="cyber-label">
                Phone
              </label>
              <input
                id="user-phone"
                name="phone"
                defaultValue={profile.phone ?? ""}
                className="cyber-input"
              />
            </div>

            <div>
              <label htmlFor="user-title" className="cyber-label">
                Title
              </label>
              <input
                id="user-title"
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
            <SubmitButton className="cyber-button" pendingText="Saving…">
              Save Profile
            </SubmitButton>
          </div>
        </form>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Memberships</h2>

        <div className="mt-6 space-y-4">
          {memberships && memberships.length > 0 ? (
            memberships.map((membership: Membership) => {
              const org = orgMap.get(membership.organization_id);
              const role = roleMap.get(membership.role_id);

              return (
                <div
                  key={membership.id}
                  className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
                >
                  <div className="mb-4">
                    <p className="font-medium text-slate-50">{org?.name ?? "Unknown Org"}</p>
                    <p className="text-sm text-slate-400">
                      Current Role: {role?.name ?? "Unknown"} • Status: {membership.status}
                    </p>
                  </div>

                  <MembershipForm
                    membershipId={membership.id}
                    userId={profile?.id ?? ""}
                    organizationName={org?.name ?? "this organization"}
                    roleId={membership.role_id}
                    status={membership.status}
                    isBillingContact={membership.is_billing_contact}
                    isSecurityContact={membership.is_security_contact}
                    allRoles={allRoles}
                  />
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4 text-slate-400">
              No memberships found.
            </div>
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Permissions</h2>
        <p className="mt-2 text-sm text-slate-400">
          Role-based permissions with per-user overrides. Click a cell to cycle: allow → deny →
          reset to role default.
        </p>
        <UserPermissionOverridesClient
          userId={userId}
          memberships={(memberships ?? []).filter(
            (m: Membership) => m.status === "approved" || m.status === "pending",
          )}
        />
      </section>
    </AdminPageShell>
  );
}
