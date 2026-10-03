import { requireAdminAccess } from "@/lib/auth/admin";
import { loadCatalog } from "@/lib/catalog/catalog-source";
import ImportExportClient from "./ImportExportClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Import & Export - Store - Admin - Maine CyberTech" };

export default async function AdminImportExportPage() {
  await requireAdminAccess();
  const { products, categories } = await loadCatalog();

  const exportable = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    categoryId: product.categoryId,
    category: product.category,
    type: product.type,
    display: product.display,
    status: product.status,
    priceRange: product.priceRange,
    summary: product.summary,
    pricingModel: product.pricingModel,
    purchaseMode: product.purchaseMode,
    marketingHeadline: product.marketingHeadline,
    marketingCopy: product.marketingCopy,
    tags: product.tags,
    attributes: {
      bestFor: product.bestFor,
      whatIsIncluded: product.whatIsIncluded,
      customerOutcomes: product.customerOutcomes,
      whatIsNotIncluded: product.whatIsNotIncluded,
      customerPrerequisites: product.customerPrerequisites,
      intakeFields: product.intakeFields,
      fulfillmentWorkflow: product.fulfillmentWorkflow,
      internalProcedure: product.internalProcedure,
      qaChecklist: product.qaChecklist,
      evidenceToCollect: product.evidenceToCollect,
      complianceNotes: product.complianceNotes,
      recommendedUpsells: product.recommendedUpsells,
      addOns: product.addOns,
      bundleEligible: product.bundleEligible,
      riskLevel: product.riskLevel,
      deliveryEffort: product.deliveryEffort,
    },
  }));

  return <ImportExportClient products={exportable} categories={categories} />;
}
