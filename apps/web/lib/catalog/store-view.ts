import type { StoreProduct, StoreCategory } from "@mct/sdk";
import type { CatalogProduct, Category, InternalProcedure, PricingModel, PurchaseMode, RiskLevel, DeliveryEffort, IntakeField } from "./types";

const EMPTY_PROCEDURE: InternalProcedure = {
  triage: [],
  delivery: [],
  documentation: [],
  qa: [],
  closeout: [],
};

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

function asIntakeFields(v: unknown): IntakeField[] {
  return Array.isArray(v) ? (v as IntakeField[]) : [];
}

function asProcedure(v: unknown): InternalProcedure {
  if (v && typeof v === "object") {
    const p = v as Partial<InternalProcedure>;
    return {
      triage: p.triage ?? [],
      delivery: p.delivery ?? [],
      documentation: p.documentation ?? [],
      qa: p.qa ?? [],
      closeout: p.closeout ?? [],
    };
  }
  return EMPTY_PROCEDURE;
}

/**
 * Flattens a DB-backed `StoreProduct` (whose rich fields live in `attributes`)
 * into the flat `CatalogProduct` shape the admin UI expects. This preserves the
 * existing rendering while switching the data source from static JSON to the API.
 */
export function toProductView(p: StoreProduct): CatalogProduct {
  const attrs = (p.attributes ?? {}) as Record<string, unknown>;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    categoryId: p.categoryId ?? "",
    category: p.category ?? "",
    type: p.type ?? "service",
    display: p.display ?? true,
    status: p.status ?? "draft",
    priceRange: p.priceRange ?? "",
    pricingModel: (p.pricingModel as PricingModel) ?? "one_time_or_project",
    purchaseMode: (p.purchaseMode as PurchaseMode) ?? "consultation_or_checkout",
    summary: p.summary ?? "",
    marketingHeadline: p.marketingHeadline ?? "",
    marketingCopy: p.marketingCopy ?? "",
    bestFor: asStringArray(attrs.bestFor),
    whatIsIncluded: asStringArray(attrs.whatIsIncluded),
    customerOutcomes: asStringArray(attrs.customerOutcomes),
    whatIsNotIncluded: asStringArray(attrs.whatIsNotIncluded),
    customerPrerequisites: asStringArray(attrs.customerPrerequisites),
    intakeFields: asIntakeFields(attrs.intakeFields),
    fulfillmentWorkflow: asStringArray(attrs.fulfillmentWorkflow),
    internalProcedure: asProcedure(attrs.internalProcedure),
    qaChecklist: asStringArray(attrs.qaChecklist),
    evidenceToCollect: asStringArray(attrs.evidenceToCollect),
    complianceNotes: asStringArray(attrs.complianceNotes),
    recommendedUpsells: asStringArray(attrs.recommendedUpsells),
    addOns: asStringArray(attrs.addOns),
    bundleEligible: (attrs.bundleEligible as boolean) ?? false,
    tags: p.tags ?? [],
    riskLevel: (attrs.riskLevel as RiskLevel) ?? "normal",
    deliveryEffort: (attrs.deliveryEffort as DeliveryEffort) ?? "standard",
  };
}

export function toCategoryView(c: StoreCategory): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    productIds: c.productIds ?? [],
    count: c.count ?? c.productCount ?? 0,
  };
}
