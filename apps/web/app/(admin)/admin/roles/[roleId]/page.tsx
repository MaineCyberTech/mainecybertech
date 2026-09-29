import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { withRetry } from "@/lib/retry";
import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RolePermissionsEditor from "@/components/admin/RolePermissionsEditor";
import RoleEditForm from "@/components/admin/RoleEditForm";
import type { Role } from "@mct/sdk";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  return { title: `Role Details (${roleId.slice(0, 8)}) - Admin - Maine CyberTech` };
}

type Props = { params: Promise<{ roleId: string }> };

export default async function RoleDetailPage({ params }: Props) {
  await requireAdminAccess();
  await requirePermission("roles", "view");
  const { roleId } = await params;
  const api = getApiClient();

  let role: Role;
  try {
    role = await withRetry(() => api.roles.get(roleId));
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="cyber-heading text-lg">Role Settings</h2>
            <p className="mt-1 text-sm text-slate-400">Edit the role name and description.</p>
          </div>
          <RoleEditForm
            roleId={roleId}
            initialName={role.name}
            initialDescription={role.description ?? null}
            isSystem={role.is_system ?? false}
          />
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Permission Toggles</h2>
        <p className="mt-2 text-sm text-slate-400">
          Click a cell to grant or revoke the permission for this role.
        </p>
        <div className="mt-6">
          <RolePermissionsEditor
            roleId={roleId}
            roleKey={role.key}
            isSystem={role.is_system ?? false}
          />
        </div>
      </section>
    </AdminPageShell>
  );
}
