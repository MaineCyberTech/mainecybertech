import Link from "next/link";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getApiClient } from "@/lib/api";
import { toProductView, toCategoryView } from "@/lib/catalog/store-view";
import ProductForm from "./ProductForm";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products - Store - Admin - Maine CyberTech" };

function riskColor(risk: string) {
  const map: Record<string, string> = {
    normal: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    elevated: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    high: "border-red-500/25 bg-red-500/10 text-red-400",
    emergency: "border-purple-500/25 bg-purple-500/10 text-purple-400",
  };
  return map[risk] ?? "border-white/10 bg-white/5 text-slate-400";
}

function statusPill(status: string) {
  const lower = status.toLowerCase();
  if (lower === "live" || lower === "active" || lower === "published") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-400";
  }
  if (lower.startsWith("draft") || lower === "hidden") {
    return "border-slate-500/25 bg-slate-500/10 text-slate-400";
  }
  return "border-white/10 bg-white/5 text-slate-400";
}

async function fetchProducts() {
  try {
    const products = await getApiClient().store.listProducts();
    return products.map(toProductView);
  } catch {
    return [];
  }
}

async function fetchCategories() {
  try {
    const categories = await getApiClient().store.listCategories();
    return categories.map(toCategoryView);
  } catch {
    return [];
  }
}

export default async function AdminStoreProductsPage(props: {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
}) {
  await requireAdminAccess();
  const { q, category, status } = await props.searchParams;

  const [allProducts, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  let filtered = allProducts;
  const query = (q ?? "").trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        p.summary.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query),
    );
  }
  if (category) {
    filtered = filtered.filter((p) => p.categoryId === category);
  }
  if (status) {
    filtered = filtered.filter((p) => p.status.toLowerCase() === status.toLowerCase());
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Products" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-products" />}
      title="Products"
      description={`${filtered.length} product${filtered.length === 1 ? "" : "s"} in the catalog`}
      actions={
        <ProductForm mode="create" categories={categories}>
          <button type="button" className="cyber-button">
            Create Product
          </button>
        </ProductForm>
      }
    >
      <form
        method="GET"
        action="/admin/store/products"
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full rounded-lg border border-white/10 bg-cyber-base py-2 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
        <select
          name="category"
          defaultValue={category ?? ""}
          aria-label="Filter by category"
          className="rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status ?? ""}
          aria-label="Filter by status"
          className="rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
        >
          <option value="">All statuses</option>
          {Array.from(new Set(allProducts.map((p) => p.status))).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit" className="cyber-button">
          Filter
        </button>
        {q || category || status ? (
          <Link
            href="/admin/store/products"
            className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:border-emerald-600/30 hover:text-slate-200"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-lg border border-white/10 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-cyber-base/60">
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Price Range</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-300">Risk</th>
              <th className="px-4 py-3 text-right font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-50">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.slug}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {categoryMap.get(p.categoryId) ?? p.categoryId}
                </td>
                <td className="px-4 py-3 text-emerald-400">{p.priceRange}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusPill(p.status)}`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${riskColor(p.riskLevel)}`}
                  >
                    {p.riskLevel}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <ProductForm mode="edit" product={p} categories={categories}>
                      <button
                        type="button"
                        className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
                      >
                        Edit
                      </button>
                    </ProductForm>
                    <DeleteButton id={p.id} name={p.name} />
                    <Link
                      href={`/admin/store/products/${p.id}`}
                      className="text-xs font-semibold text-slate-400 transition hover:text-emerald-300"
                    >
                      View →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No products match the current filters.
          </div>
        ) : null}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/admin/store/products/${p.id}`}
            className="glass-card glass-card-hover block p-4 no-underline"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-slate-50">{p.name}</p>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusPill(p.status)}`}
              >
                {p.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{p.slug}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{categoryMap.get(p.categoryId) ?? p.categoryId}</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400">{p.priceRange}</span>
              <span
                className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${riskColor(p.riskLevel)}`}
              >
                {p.riskLevel}
              </span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-8 text-center text-sm text-slate-400">
            No products match the current filters.
          </div>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
