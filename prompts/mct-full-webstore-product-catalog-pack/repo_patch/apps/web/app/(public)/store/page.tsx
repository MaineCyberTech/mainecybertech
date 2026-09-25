import Link from "next/link";
import { categories, getProductsByCategory } from "../../../lib/catalog/store";

export default function StorePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <section className="mb-12">
        <p className="text-sm font-semibold tracking-wide text-cyan-600 uppercase">
          Maine Cyber Tech Store
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Productized IT, cybersecurity, web, network, and continuity services.
        </h1>
        <p className="text-muted-foreground mt-4 max-w-3xl text-lg">
          Browse practical small-business technology services with clear scopes, intake questions,
          deliverables, bundles, and next-step recommendations.
        </p>
      </section>
      <nav className="mb-12 grid gap-3 md:grid-cols-3 lg:grid-cols-4" aria-label="Store categories">
        {categories.map((category) => (
          <a
            key={category.id}
            href={`#${category.slug}`}
            className="rounded-xl border p-4 hover:shadow-md"
          >
            <strong>{category.name}</strong>
            <br />
            <span className="text-muted-foreground text-sm">{category.count} products</span>
          </a>
        ))}
      </nav>
      {categories.map((category) => {
        const products = getProductsByCategory(category.id);
        return (
          <section key={category.id} id={category.slug} className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-bold">{category.name}</h2>
            <p className="text-muted-foreground mt-2 max-w-3xl">{category.description}</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <article key={product.id} className="rounded-2xl border p-5 shadow-sm">
                  <p className="text-sm font-semibold text-cyan-700">{product.priceRange}</p>
                  <h3 className="mt-2 text-xl font-semibold">{product.name}</h3>
                  <p className="text-muted-foreground mt-3 text-sm">{product.summary}</p>
                  <Link
                    className="mt-5 inline-flex font-semibold text-cyan-700"
                    href={`/store/${product.slug}`}
                  >
                    View details
                  </Link>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
