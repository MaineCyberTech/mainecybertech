import { loadCatalog } from "@/lib/catalog/catalog-source";
import QuoteBuilderClient from "@/components/store/QuoteBuilderClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Build a Quote - Store - Maine CyberTech" };

export default async function QuotePage() {
  const catalog = await loadCatalog();

  return (
    <section className="px-4 pb-24 pt-24 sm:px-6 sm:pb-32 sm:pt-32">
      <QuoteBuilderClient products={catalog.products} />
    </section>
  );
}
