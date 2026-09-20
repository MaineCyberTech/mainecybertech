import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import ClientPortalEntitlementsForm from "./ClientPortalEntitlementsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client Portal - Admin - Maine CyberTech" };

type Props = { searchParams: Promise<{ organizationId?: string }> };

export default async function AdminClientPortalPage({ searchParams }: Props) {
  await requireAdminAccess();
  const api = getApiClient();
  const { organizationId } = await searchParams;

  let organizations: Array<{ id: string; name: string }> = [];
  try {
    const r = (await api.organizations.list({ limit: 100 })) as unknown as {
      items: Array<{ id: string; name: string }>;
    };
    organizations = r.items ?? [];
  } catch (error) {
    console.error("[admin/client-portal]", error);
  }

  const orgId = organizationId ?? organizations[0]?.id ?? null;

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Client Portal" }]} />
      }
      subnav={<AdminSubnav current="client-portal" />}
      title="Client Portal"
      description="Provision which portal modules each client organisation can use."
      actions={null}
    >
      {organizations.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/admin/client-portal?organizationId=${org.id}`}
              className={
                org.id === orgId
                  ? "rounded-md border border-emerald-600/40 bg-emerald-600/10 px-3 py-1 text-xs text-emerald-300"
                  : "rounded-md border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-emerald-600/40"
              }
            >
              {org.name}
            </Link>
          ))}
        </div>
      )}

      {orgId ? (
        <ClientPortalEntitlementsForm organizationId={orgId} />
      ) : (
        <p className="text-sm text-slate-400">No organizations available.</p>
      )}
    </AdminPageShell>
  );
}
