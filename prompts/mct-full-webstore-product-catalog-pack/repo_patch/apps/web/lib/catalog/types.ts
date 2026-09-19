export type IntakeFieldType = "text" | "email" | "tel" | "number" | "textarea" | "select" | "url";
export interface IntakeField {
  id: string;
  label: string;
  type: IntakeFieldType;
  required: boolean;
  help?: string;
  options?: string[];
}
export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  category: string;
  type: string;
  display: boolean;
  status: string;
  priceRange: string;
  pricingModel: string;
  purchaseMode: string;
  summary: string;
  marketingHeadline: string;
  marketingCopy: string;
  bestFor: string[];
  whatIsIncluded: string[];
  customerOutcomes: string[];
  whatIsNotIncluded: string[];
  customerPrerequisites: string[];
  intakeFields: IntakeField[];
  fulfillmentWorkflow: string[];
  qaChecklist: string[];
  evidenceToCollect: string[];
  complianceNotes: string[];
  recommendedUpsells: string[];
  addOns: string[];
  bundleEligible: boolean;
  tags: string[];
  riskLevel: string;
  deliveryEffort: string;
}
export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productIds: string[];
  count: number;
}
