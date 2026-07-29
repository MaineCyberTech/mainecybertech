import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getTestimonials } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testimonials - Store - Admin - Maine CyberTech" };

export default async function AdminStoreTestimonialsPage() {
  await requireAdminAccess();
  const testimonials = getTestimonials();

  const approved = testimonials.filter((t) => t.approved);
  const pending = testimonials.filter((t) => !t.approved);

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Testimonials" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-testimonials" />}
      title="Testimonial Management"
      description={`${testimonials.length} total, ${approved.length} approved, ${pending.length} pending`}
    >
      {testimonials.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-6 text-center text-sm text-slate-400">
          No testimonial records yet. Use the management tools to add new testimonials.
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((t) => (
            <div key={t.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-slate-200">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-1 text-xs text-slate-500">— {t.author}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    t.approved
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/25 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {t.approved ? "Approved" : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
