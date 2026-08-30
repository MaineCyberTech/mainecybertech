import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staging Detail - Portal - Maine CyberTech" };

type PortalStagingDetailProps = {
  params: Promise<{ id: string }>;
};

type StagingDetail = {
  id: string;
  device_name: string;
  asset_tag: string | null;
  status: string;
  checklist: unknown[];
  assigned_to: string | null;
};

export default async function PortalStagingDetailPage({ params }: PortalStagingDetailProps) {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const { id } = await params;
  const api = getApiClient();

  let item: StagingDetail | null = null;

  try {
    item = (await api.staging.get(id)) as StagingDetail;
  } catch {
    /* graceful */
  }

  return (
    <div className="space-y-6" role="region" aria-label="Hardware Staging Detail">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Hardware Staging", href: "/portal/hardware-staging" },
          { label: item?.device_name ?? "Detail" },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">{item?.device_name ?? "Staging Detail"}</h1>
      {item ? (
        <div className="space-y-4 rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-slate-50">{item.device_name}</p>
            <StatusPill status={item.status || "unknown"} />
          </div>
          <p className="text-xs text-slate-400">
            {item.asset_tag ? `Tag: ${item.asset_tag}` : "No asset tag"}
          </p>
          <ul className="list-inside list-disc text-sm text-slate-300">
            {(Array.isArray(item.checklist) ? item.checklist : []).length > 0 ? (
              (item.checklist as unknown[]).map((c, i) => <li key={i}>{JSON.stringify(c)}</li>)
            ) : (
              <li className="text-slate-500">No checklist items</li>
            )}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Staging check not found.</p>
      )}
      <Link
        href="/portal/hardware-staging"
        className="text-sm text-emerald-500 hover:text-emerald-400"
      >
        &larr; Back to staging
      </Link>
    </div>
  );
}
