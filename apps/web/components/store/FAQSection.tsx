import { getFAQData, getFAQsForProduct } from "@/lib/catalog/v5-loaders";
import type { FAQItem } from "@/lib/catalog/types";

interface FAQSectionProps {
  productId?: string;
  categoryId?: string;
}

export default function FAQSection({ productId, categoryId }: FAQSectionProps) {
  let faqs: FAQItem[] = [];
  if (productId) {
    faqs = getFAQsForProduct(productId);
  }
  if (faqs.length === 0) {
    const data = getFAQData();
    faqs = categoryId
      ? data.faqs.filter((f) => f.categoryId === categoryId)
      : data.faqs.slice(0, 3);
  }
  if (faqs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-orbitron text-2xl font-bold uppercase tracking-wider text-slate-50">
        Frequently Asked <span className="text-emerald-500">Questions</span>
      </h2>
      {faqs.map((faq) => (
        <details
          key={faq.id}
          className="group rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-4 backdrop-blur-sm"
        >
          <summary className="font-orbitron cursor-pointer text-sm font-bold text-slate-100 transition group-open:text-emerald-400">
            {faq.question}
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
