import { getAllProducts } from "@/lib/catalog/loader";
import QuoteBuilderClient from "@/components/store/QuoteBuilderClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Build a Quote - Store - Maine CyberTech" };

export default function QuotePage() {
  const products = getAllProducts();

  return (
    <section className="px-4 pb-24 pt-24 sm:px-6 sm:pb-32 sm:pt-32">
      <QuoteBuilderClient products={products} />
    </section>
  );
}
