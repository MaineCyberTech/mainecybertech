import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getFAQData } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "FAQs - Store - Admin - Maine CyberTech" };

export default async function AdminStoreFAQsPage() {
  await requireAdminAccess();
  const data = getFAQData();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "FAQs" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-faqs" />}
      title="FAQ Management"
      description={`${data.faqs.length} starter FAQs`}
      actions={
        <button
          type="button"
          className="rounded-lg border border-emerald-600/50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-400 transition hover:bg-emerald-600/10"
        >
          Manage FAQs
        </button>
      }
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Starter FAQs ({data.faqs.length})
        </h2>
        <div className="space-y-3">
          {data.faqs.map((faq) => (
            <details
              key={faq.id}
              className="group rounded-lg border border-white/10 bg-cyber-base/60"
            >
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-medium text-slate-200">
                <span>{faq.question}</span>
                <svg
                  className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="border-t border-white/5 px-4 py-3">
                <p className="text-xs text-slate-400">{faq.answer}</p>
                <p className="mt-2 font-mono text-[11px] text-slate-600">ID: {faq.id}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
