import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import type { IdentityVerification } from "@mct/sdk";
import StatusPill from "@/components/StatusPill";

import DataErrorNote from "@/components/admin/DataErrorNote";
import { hasPermission } from "@/lib/permissions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Identity Verification - Portal - Maine CyberTech" };

export default async function PortalIdentityVerificationPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: IdentityVerification[] = [];
  try {
    const r = await api.securitySuite.idVerify.list({ organizationId: orgId });
    items = r.items as IdentityVerification[];
  } catch (error) {
    console.error("[identity-verification/page]", error);
    loadFailed = true;
  }

  const permissions = await Promise.resolve()
    .then(() => api.permissions.getMyPermissions())
    .catch(() => null);
  const canCreate =
    Boolean(permissions?.isSuperAdmin) ||
    hasPermission(permissions?.keys, "identity-verification", "create");

  return (
    <div className="space-y-6" role="region" aria-label="Identity Verification">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Identity Verification" }]}
      />
      {loadFailed ? <DataErrorNote what="identity-verification" /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Identity Verification</h1>
          <p className="mt-1 text-sm text-slate-400">
            {items.length} verification request{items.length !== 1 ? "s" : ""} for your
            organization.
          </p>
        </div>
        {canCreate ? (
          <Link href="/portal/identity-verification/new" className="cyber-button">
            Request verification
          </Link>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div key={a.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{a.requestor_name}</p>
              <StatusPill status={a.status} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Method: {a.verification_method} &bull; Passed: {a.verification_pass ? "✅" : "❌"}
            </p>
          </div>
        ))}
        {!loadFailed && items.length === 0 && (
          <div className="col-span-2">
            <EmptyState icon="🔑" title="No verification requests found." />
          </div>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
