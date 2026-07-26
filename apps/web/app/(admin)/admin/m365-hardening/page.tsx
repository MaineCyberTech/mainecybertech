import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
export const dynamic = "force-dynamic";
export const metadata = { title: "M365 Hardening" };
const chk = (v: boolean) => (v ? "✅" : "⬜");
export default async function M365Page() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    tenant_domain: string;
    mfa_enforced: boolean;
    conditional_access_configured: boolean;
    legacy_auth_blocked: boolean;
    overall_score: number | null;
    status: string;
  }> = [];
  try {
    const r = await api.securitySuite.m365.list({});
    items = r.items as unknown as typeof items;
  } catch {
    /* */
  }
  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "M365 Hardening" }]} />
      }
      subnav={<AdminSubnav current="m365-hardening" />}
      title="M365 Tenant Hardening Scanner"
      description="Guided Microsoft 365 security baseline: MFA, Conditional Access, legacy auth, Defender, DLP."
      actions={null}
    >
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((t) => (
              <div key={t.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <p className="font-medium text-slate-50">{t.tenant_domain}</p>
                <p className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  {chk(t.mfa_enforced)} MFA {chk(t.conditional_access_configured)} CA{" "}
                  {chk(t.legacy_auth_blocked)} Legacy Blocked &bull; Score: {t.overall_score ?? "—"}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🏢"
              title="No M365 assessments"
              description="Assess a Microsoft 365 tenant security posture."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
