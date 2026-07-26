import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata = { title: "Identity Verification" };
export default async function IdVerifyPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    requestor_name: string;
    verification_method: string;
    verification_pass: boolean;
    status: string;
  }> = [];
  try {
    const r = await api.securitySuite.idVerify.list({});
    items = r.items as unknown as typeof items;
  } catch {
    /* */
  }
  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "ID Verify" }]} />
      }
      subnav={<AdminSubnav current="id-verify" />}
      title="Identity Verification Anti-Vishing"
      description="Verify requestor identity before privileged actions like MFA reset, password reset, or vendor changes."
      actions={
        <Link href="/admin/id-verify/new" className="cyber-button">
          New Verification
        </Link>
      }
    >
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((v) => (
              <div key={v.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-50">{v.requestor_name}</p>
                  <span
                    className={`inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${v.verification_pass ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-red-500/25 bg-red-500/10 text-red-300"}`}
                  >
                    {v.verification_pass ? "PASSED" : "FAILED"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Method: {v.verification_method} &bull; Status: {v.status}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🛡️"
              title="No verifications"
              description="Verify identities before privileged changes."
              actionHref="/admin/id-verify/new"
              actionLabel="New Verification"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
