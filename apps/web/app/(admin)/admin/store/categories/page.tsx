import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getApiClient } from "@/lib/api";
import { toCategoryView } from "@/lib/catalog/store-view";
import CategoryForm from "./CategoryForm";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Store Categories - Admin" };

async function fetchCategories() {
  try {
    const categories = await getApiClient().store.listCategories();
    return categories.map(toCategoryView);
  } catch {
    return [];
  }
}

async function fetchProducts() {
  try {
    return await getApiClient().store.listProducts();
  } catch {
    return [];
  }
}

export default async function StoreCategoriesPage() {
  await requireAdminAccess();
  const [categories, products] = await Promise.all([fetchCategories(), fetchProducts()]);
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Categories" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-categories" />}
      title="Category Manager"
      description="Manage store categories and their product assignments."
      actions={
        <div className="flex items-center gap-3">
          <div className="cyber-pill">{categories.length} categories</div>
          <CategoryForm mode="create" products={products}>
            <button type="button" className="cyber-button">
              Create Category
            </button>
          </CategoryForm>
        </div>
      }
    >
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const catProducts = cat.productIds
            .map((id) => (productMap.has(id) ? { id, name: productMap.get(id)! } : null))
            .filter(Boolean) as { id: string; name: string }[];
          return (
            <div
              key={cat.id}
              className="glass-card group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#0A1118]/80 to-[#0D1622]/80 p-5 transition hover:border-emerald-600/30 hover:shadow-[0_0_20px_rgba(5,150,105,0.08)]"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-50">{cat.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">/{cat.slug}</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-600/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  {catProducts.length}
                </span>
              </div>
              {cat.description ? (
                <p className="mb-3 text-sm leading-relaxed text-slate-400">{cat.description}</p>
              ) : null}
              {catProducts.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {catProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-block rounded bg-white/5 px-2 py-0.5 text-[11px] text-slate-500"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-slate-600">No products assigned</p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <CategoryForm mode="edit" category={cat} products={products}>
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
                  >
                    Edit
                  </button>
                </CategoryForm>
                <DeleteButton id={cat.id} name={cat.name} />
              </div>
            </div>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
