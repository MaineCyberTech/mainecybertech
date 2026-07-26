import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
export const dynamic = "force-dynamic";
export const metadata = { title: "Break Glass - Admin" };

export default async function BreakGlassPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    account_name: string;
    system: string;
    custodian_name: string | null;
    last_rotated_at: string | null;
    next_rotation_at: string | null;
    status: string;
  }> = [];
  try {
    const r = await api.securityOps.breakGlass.list({});
    items = r.items as unknown as typeof items;
  } catch {
    /* */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Break Glass" }]} />
      }
      subnav={<AdminSubnav current="break-glass" />}
      title="Emergency Access Break Glass Register"
      description="Track break-glass accounts, custody, rotation, and testing without storing secrets."
      actions={null}
    >
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">
                      {a.account_name} — {a.system}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Custodian: {a.custodian_name || "—"} &bull; Rotated:{" "}
                      {a.last_rotated_at
                        ? new Date(a.last_rotated_at).toISOString().slice(0, 10)
                        : "Never"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${a.status === "active" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-300"}`}
                  >
                    {a.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🔑"
              title="No break-glass accounts"
              description="Register emergency access accounts."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
