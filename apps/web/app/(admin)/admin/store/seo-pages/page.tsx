import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getSEOLandingPages } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO Landing Pages - Store - Admin - Maine CyberTech" };

export default async function AdminStoreSEOPagesPage() {
  await requireAdminAccess();
  const seoPages = getSEOLandingPages();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "SEO Landing Pages" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-seo-pages" />}
      title="SEO Landing Page Generator"
      description={`${seoPages.length} generated page type${seoPages.length === 1 ? "" : "s"}`}
      actions={
        <button
          type="button"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
        >
          Generate SEO Page
        </button>
      }
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">SEO Pages ({seoPages.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {seoPages.map((page) => (
            <div key={page.slug} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
              <span className="inline-block rounded bg-emerald-600/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                {page.title}
              </span>
              <p className="mt-2 font-mono text-xs text-slate-400">{page.slug}</p>
              {page.services.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {page.services.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-slate-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
