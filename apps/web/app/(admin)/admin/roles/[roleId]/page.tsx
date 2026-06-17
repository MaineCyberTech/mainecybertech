import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Link from "next/link";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RolePermissionsEditor from "@/components/admin/RolePermissionsEditor";

export const dynamic = "force-dynamic";

export const metadata = { title: "Role Details - Admin - Maine CyberTech" };

type Props = { params: Promise<{ roleId: string }> };

export default async function RoleDetailPage({ params }: Props) {
  await requireAdminAccess();
  const { roleId } = await params;
  const api = getApiClient();

  let role: any;
  try {
    role = await api.roles.get(roleId);
  } catch {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        Role not found.
      </div>
    );
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <AdminBreadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Roles", href: "/admin/roles" },
            { label: role.name },
          ]}
        />
      }
      subnav={<AdminSubnav current="roles" />}
      title={role.name}
      description={role.description ?? "No description"}
      actions={
        <Link href="/admin/roles" className="cyber-button-secondary">
          Back
        </Link>
      }
    >
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Permission Toggles</h2>
        <p className="mt-2 text-sm text-slate-400">
          Click a cell to grant or revoke the permission for this role.
        </p>
        <div className="mt-6">
          <RolePermissionsEditor
            roleId={roleId}
            roleKey={role.key}
            isSystem={role.is_system}
          />
        </div>
      </section>
    </AdminPageShell>
  );
}
