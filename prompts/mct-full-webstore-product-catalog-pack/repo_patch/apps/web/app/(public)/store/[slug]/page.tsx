import { notFound } from "next/navigation";
import { getProductBySlug, getRecommendedProducts } from "../../../../lib/catalog/store";

export default function StoreProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) return notFound();
  const recs = getRecommendedProducts(product);
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-sm font-semibold tracking-wide text-cyan-600 uppercase">
        {product.category}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{product.name}</h1>
      <p className="text-muted-foreground mt-4 text-xl">{product.summary}</p>
      <p className="mt-4 font-semibold">{product.priceRange}</p>
      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">What is included</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {product.whatIsIncluded.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Outcomes</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {product.customerOutcomes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="mt-10 rounded-2xl border p-6">
        <h2 className="text-2xl font-bold">Intake questions</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Never paste passwords, API keys, MFA codes, or recovery codes into public forms. Maine
          Cyber Tech will coordinate safe access separately.
        </p>
        <ul className="mt-4 space-y-3">
          {product.intakeFields.map((f) => (
            <li key={f.id}>
              <strong>{f.label}</strong> {f.required ? "(required)" : "(optional)"}
              <br />
              <span className="text-muted-foreground text-sm">{f.help}</span>
            </li>
          ))}
        </ul>
      </section>
      {recs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">Recommended next</h2>
          <ul className="mt-4 list-disc pl-5">
            {recs.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
