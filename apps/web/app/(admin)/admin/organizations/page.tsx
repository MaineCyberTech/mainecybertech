import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import { getApiClient } from "@/lib/api";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AdminOrganizationsClient from "@/components/admin/AdminOrganizationsClient";
import CreateOrganizationForm from "@/components/admin/CreateOrganizationForm";
import AdminPagination from "@/components/admin/AdminPagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organizations - Admin - Maine CyberTech" };

const DEFAULT_LIMIT = 25;

type OrganizationsPageProps = {
  searchParams: Promise<{ page?: string; limit?: string; status?: string; ids?: string }>;
};

export default async function OrganizationsPage({ searchParams }: OrganizationsPageProps) {
  await requireAdminAccess();
  await requirePermission("organizations", "view");
  const api = getApiClient();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));
  const status = sp.status;
  const ids = sp.ids?.split(",").filter(Boolean);

  let organizations: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    primary_domain: string | null;
    support_plan: string | null;
    created_at: string;
    updated_at: string;
  }> = [];
  let total = 0;

  try {
    const r = await api.organizations.list({ page, limit, status, ids });
    organizations = r.items ?? [];
    total = r.total ?? 0;
  } catch {
    /* graceful */
  }

  const totalPages = Math.ceil(total / limit);
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", String(limit));
    if (status) params.set("status", status);
    if (ids && ids.length) params.set("ids", ids.join(","));
    return `/admin/organizations?${params.toString()}`;
  };

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Organizations" }]} />
      }
      subnav={<AdminSubnav current="organizations" />}
      title="Organizations"
      description="View and manage client tenants, domains, status, and service plans."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/organizations/new" className="cyber-button">
            Onboard organization
          </Link>
          <CreateOrganizationForm />
        </div>
      }
    >
      <AdminOrganizationsClient organizations={organizations} />
      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        buildHref={buildHref}
        total={total}
        limit={limit}
      />
    </AdminPageShell>
  );
}
