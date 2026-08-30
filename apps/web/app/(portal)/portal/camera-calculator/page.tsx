import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import CameraCalculatorClient from "./CameraCalculatorClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Camera Storage Calculator - Portal - Maine CyberTech" };

export default async function PortalCameraCalculatorPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.fieldServices.camera.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Camera Storage Calculator">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Camera Storage Calculator" },
        ]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Camera Storage Calculator</h1>
      <p className="text-sm text-slate-400">
        Estimate NVR/storage requirements and review saved calculations for your organization.
      </p>
      <CameraCalculatorClient organizationId={orgId} initialItems={items} />
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
