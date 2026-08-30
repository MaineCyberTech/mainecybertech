import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staging Detail - Field Services - Admin" };

type StagingDetailProps = {
  params: Promise<{ id: string }>;
};

type StagingDetail = {
  id: string;
  device_name: string;
  asset_tag: string | null;
  status: string;
  checklist: unknown[];
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export default async function StagingDetailPage({ params }: StagingDetailProps) {
  await requireAdminAccess();
  const { id } = await params;
  const api = getApiClient();

  let item: StagingDetail | null = null;

  try {
    item = (await api.staging.get(id)) as StagingDetail;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Field Services", href: "/admin/field-services" },
            { label: "Hardware Staging", href: "/admin/field-services/staging" },
            { label: item?.device_name ?? "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="field-services" />}
      title={item?.device_name ?? "Staging Detail"}
      description="Hardware staging checklist detail."
    >
      {item ? (
        <section className="cyber-panel space-y-4">
          <div>
            <p className="text-xs text-slate-400">Status</p>
            <p className="mt-1 font-medium text-slate-50">{item.status}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Asset Tag</p>
            <p className="mt-1 font-medium text-slate-50">{item.asset_tag ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Assigned To</p>
            <p className="mt-1 font-medium text-slate-50">{item.assigned_to ?? "Unassigned"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Checklist</p>
            <ul className="mt-1 list-inside list-disc text-sm text-slate-300">
              {(Array.isArray(item.checklist) ? item.checklist : []).length > 0 ? (
                (item.checklist as unknown[]).map((c, i) => <li key={i}>{JSON.stringify(c)}</li>)
              ) : (
                <li className="text-slate-500">No checklist items</li>
              )}
            </ul>
          </div>
        </section>
      ) : (
        <EmptyState
          icon="🖥️"
          title="Staging check not found"
          description="This device may have been removed."
        />
      )}

      <Link
        href="/admin/field-services/staging"
        className="text-sm text-emerald-500 hover:text-emerald-400"
      >
        &larr; Back to staging
      </Link>
    </AdminPageShell>
  );
}
