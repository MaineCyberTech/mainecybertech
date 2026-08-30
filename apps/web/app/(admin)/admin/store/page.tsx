import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import {
  getProductCount,
  getVisibleProductCount,
  getHiddenProductCount,
  getCategoryCount,
  getMonthlyPlans,
  getEmergencyProducts,
} from "@/lib/catalog/loader";
import { validateCatalog } from "@/lib/catalog/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store Catalog - Admin - Maine CyberTech" };

export default async function AdminStorePage() {
  await requireAdminAccess();

  const total = getProductCount();
  const visible = getVisibleProductCount();
  const hidden = getHiddenProductCount();
  const categories = getCategoryCount();
  const monthlyCount = getMonthlyPlans().length;
  const emergencyCount = getEmergencyProducts().length;

  const report = validateCatalog();
  const brokenRecs = report.issues.filter((i) => i.type === "invalid_recommendation").length;
  const productWarningIds = new Set(
    report.issues
      .filter((i) => i.severity !== "info")
      .map((i) => i.value)
      .filter((v): v is string => !!v),
  );

  const stats = [
    { label: "Total Products", value: total, color: "text-slate-50" },
    { label: "Visible Products", value: visible, color: "text-emerald-400" },
    { label: "Hidden / Draft", value: hidden, color: "text-slate-400" },
    { label: "Categories", value: categories, color: "text-sky-400" },
    { label: "Emergency Services", value: emergencyCount, color: "text-red-400" },
    { label: "Monthly Plans", value: monthlyCount, color: "text-purple-400" },
    {
      label: "Products with Issues",
      value: productWarningIds.size,
      color: productWarningIds.size > 0 ? "text-amber-400" : "text-emerald-400",
    },
    {
      label: "Broken Recommendations",
      value: brokenRecs,
      color: brokenRecs > 0 ? "text-red-400" : "text-emerald-400",
    },
  ];

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Store Catalog" }]} />
      }
      subnav={<AdminSubnav current="store" />}
      title="Store Catalog"
      description="Product catalog health monitoring and management."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="cyber-panel">
            <p className="text-sm text-slate-400">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {report.issues.filter((i) => i.severity !== "info").length > 0 ? (
        <section className="mt-8">
          <h2 className="cyber-heading mb-4 text-lg">Catalog Health Issues</h2>
          <div className="space-y-2">
            {report.issues
              .filter((i) => i.severity !== "info")
              .map((issue, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-4 text-sm ${
                    issue.severity === "error"
                      ? "border-red-500/20 bg-red-500/5 text-red-300"
                      : "border-amber-500/20 bg-amber-500/5 text-amber-300"
                  }`}
                >
                  <span className="mr-2 inline-block rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {issue.type}
                  </span>
                  {issue.message}
                </div>
              ))}
          </div>
        </section>
      ) : (
        <div className="mt-8 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-6 text-center text-sm text-emerald-300">
          No catalog health issues found. All products and references are valid.
        </div>
      )}
    </AdminPageShell>
  );
}
