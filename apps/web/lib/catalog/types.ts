export type IntakeFieldType = "text" | "email" | "tel" | "number" | "textarea" | "select" | "url";

export interface IntakeField {
  id: string;
  label: string;
  type: IntakeFieldType;
  required: boolean;
  help: string;
  options?: string[];
}

export type PricingModel =
  | "one_time_or_project"
  | "recurring_monthly"
  | "tiered_monthly"
  | "retainer";

export type PurchaseMode =
  | "consultation_or_checkout"
  | "consultation_required"
  | "direct_checkout"
  | "retainer_or_subscription";

export type RiskLevel = "normal" | "elevated" | "high" | "emergency";
export type DeliveryEffort = "standard" | "medium" | "complex";

export interface InternalProcedure {
  triage: string[];
  delivery: string[];
  documentation: string[];
  qa: string[];
  closeout: string[];
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  category: string;
  type: string;
  display: boolean;
  status: string;
  priceRange: string;
  pricingModel: PricingModel;
  purchaseMode: PurchaseMode;
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
  internalProcedure: InternalProcedure;
  qaChecklist: string[];
  evidenceToCollect: string[];
  complianceNotes: string[];
  recommendedUpsells: string[];
  addOns: string[];
  bundleEligible: boolean;
  tags: string[];
  riskLevel: RiskLevel;
  deliveryEffort: DeliveryEffort;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  productIds: string[];
  count: number;
}

export interface RecommendationRule {
  id: string;
  whenCategoryViewed: string;
  whenTagsInclude?: string[];
  recommend: string[];
}

export interface CheckoutPolicy {
  directCheckoutEligible: string;
  consultationRequired: string;
  neverCollectInPublicForms: string[];
}

export interface BundleRule {
  id: string;
  whenCategoryViewed: string;
  whenTagsInclude?: string[];
  recommend: string[];
}

export interface CatalogValidationIssue {
  type: string;
  severity: "error" | "warning" | "info";
  message: string;
  field?: string;
  value?: string;
}

export interface CatalogHealthReport {
  issues: CatalogValidationIssue[];
}

// --- Conversion Module Types ---

export interface PromotionType {
  id: string;
  label: string;
  description: string;
}

export interface DisplayPattern {
  id: string;
  label: string;
  where: string;
  copyExamples: string[];
}

export interface PromoGuardrails {
  disallowed: string[];
  required: string[];
}

export interface PromoRules {
  version: string;
  principles: string[];
  promotionTypes: PromotionType[];
  displayPatterns: DisplayPattern[];
  guardrails: PromoGuardrails;
}

export interface TrustBadge {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface TrustBadgePlacement {
  surface: string;
  maxBadges?: number;
  requiredBadges?: string[];
}

export interface TrustBadgesData {
  version: string;
  module: string;
  badges: TrustBadge[];
  placementRules: TrustBadgePlacement[];
}

export interface CategoryVisual {
  category: string;
  icon: string;
  imagePrompt: string;
}

export interface VisualServiceMap {
  version: string;
  iconLibraryRecommendation: string;
  style: string;
  categoryVisuals: CategoryVisual[];
  assetRules: string[];
  stockSources: { name: string; use: string }[];
}

export interface CampaignVisual {
  icon: string;
  accent: string;
}

export interface SeasonalCampaign {
  id: string;
  name: string;
  audience: string;
  headline: string;
  recommendedProducts: string[];
  trustBadges: string[];
  promoEligibility: string[];
  visual: CampaignVisual;
}

export interface SeasonalCampaignsData {
  version: string;
  module: string;
  campaigns: SeasonalCampaign[];
}

export interface QuizOption {
  value: string;
  label: string;
}

export interface QuizQuestion {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: QuizOption[];
}

export interface QuizRecommendationWhen {
  primary_concern?: string;
  urgency_level?: string;
}

export interface QuizRecommendation {
  when: QuizRecommendationWhen;
  quickWin: string;
  bundle: string;
  monthlyPlan: string;
}

export interface ServiceFinderQuiz {
  version: string;
  module: string;
  goal: string;
  questions: QuizQuestion[];
  recommendationMap: QuizRecommendation[];
  emergencyOverride: QuizRecommendation;
}

export interface BundleValuePanelField {
  bundleId: string;
  componentProductIds: string[];
  mode: string;
  includedValueText: string;
  assumptions: string[];
  disclaimer: string;
}

export interface BundleSavingsCalculator {
  version: string;
  module: string;
  calculationModes: { id: string; label: string; useWhen: string }[];
  fields: string[];
  displayRules: Record<string, string>;
  exampleBundleValuePanels: BundleValuePanelField[];
}

// --- V5 Operational Module Types ---

export interface ComparisonItem {
  productId: string;
  product: CatalogProduct | null;
  values: Record<string, string[]>;
}

export interface ComparisonPage {
  slug: string;
  title: string;
  items: string[];
  sections: string[];
}

export interface ComparisonPagesData {
  version: string;
  comparisons: ComparisonPage[];
}

export interface LeadMagnetDownload {
  id: string;
  title: string;
  description: string;
  publicSlug: string;
  relatedProducts: string[];
  leadCaptureRequired: boolean;
  filePath: string;
  lastReviewedAt: string;
  checklistItems: string[];
}

export interface LeadMagnetsData {
  version: string;
  downloads: LeadMagnetDownload[];
  fields: string[];
}

export interface CaseStudyTemplateSection {
  name: string;
}

export interface CaseStudyApprovalStatus {
  label: string;
  value: string;
}

export interface CaseStudyGeneratorData {
  version: string;
  templateSections: string[];
  approvalStatuses: string[];
}

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  organization: string;
  status: string;
  productsUsed: string[];
  outcome: string;
  beforeAfter: string;
  publishedAt: string;
  approved: boolean;
}

export interface PackageLadderEntry {
  category: string;
  good: string;
  better: string;
  best: string;
}

export interface PackageLaddersData {
  version: string;
  ladders: PackageLadderEntry[];
}

export interface PortalServiceHubData {
  version: string;
  sections: string[];
  statuses: string[];
}

// --- V5 Analytics, Automation & Sales Ops Types ---

export interface AnalyticsEvent {
  event: string;
  anonymousId?: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  page?: string;
  productId?: string;
  categoryId?: string;
  promoId?: string;
  quizId?: string;
  quoteId?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

export interface ScoreBand {
  id: string;
  min: number;
  max: number;
}

export interface LeadScoreRule {
  id: string;
  label: string;
  points: number;
}

export interface LeadScoringData {
  version: string;
  scoreBands: ScoreBand[];
  rules: LeadScoreRule[];
  statuses: string[];
  adminFields: string[];
}

export interface RecV2Example {
  sourceProduct: string;
  recommend: string[];
}

export interface RecEngineV2Data {
  version: string;
  recommendationTypes: string[];
  examples: RecV2Example[];
  adminRules: string[];
}

export interface ComparisonSection {
  slug: string;
  title: string;
  items: string[];
  sections: string[];
}

export interface ComparisonData {
  version: string;
  comparisons: ComparisonSection[];
}

export interface PackageLadderEntry {
  category: string;
  good: string;
  better: string;
  best: string;
}

export interface PackageLadderItem {
  tier: string;
  label: string;
  productId: string;
}

export interface PackageLadder {
  categoryId: string;
  items: PackageLadderItem[];
}

export interface PackageLadderEntry {
  category: string;
  good: string;
  better: string;
  best: string;
}

export interface ProposalData {
  version: string;
  fields: string[];
}

export interface IntakeToProjectData {
  version: string;
  entities: string[];
  statusMap: Record<string, string>;
}

export interface LifecycleState {
  id: string;
  label: string;
}

export interface ProductLifecycleData {
  version: string;
  states: LifecycleState[];
}

export interface ContentAuditDimension {
  id: string;
  label: string;
}

export interface ContentQualityAuditorData {
  version: string;
  dimensions: ContentAuditDimension[];
}

export interface SEOLandingPage {
  slug: string;
  title: string;
  location?: string;
  vertical?: string;
  services: string[];
  faqs: { question: string; answer: string }[];
}

export interface SEOLandingPagesData {
  version: string;
  landingPages: SEOLandingPage[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  categoryId?: string;
  productId?: string;
}

export interface FAQSystemData {
  version: string;
  faqs: FAQItem[];
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  organization?: string;
  approved: boolean;
  provenance: string;
  consentObtained: boolean;
  productId?: string;
}

export interface TestimonialSystemData {
  version: string;
  testimonials: Testimonial[];
}

export interface EmailNurtureSequence {
  id: string;
  name: string;
  interestArea: string;
  funnelStage: string;
  steps: { subject: string; body: string; delayDays: number }[];
}

export interface EmailNurtureData {
  version: string;
  sequences: EmailNurtureSequence[];
}

export interface FulfillmentChecklistItem {
  productId: string;
  tasks: string[];
}

export interface FulfillmentChecklistData {
  version: string;
  checklists: FulfillmentChecklistItem[];
}

export interface ProfitScoreDimension {
  id: string;
  label: string;
  weight: number;
}

export interface ProfitabilityData {
  version: string;
  dimensions: ProfitScoreDimension[];
}

export interface DependencyRule {
  productId: string;
  requires: string[];
  recommends: string[];
  severity: "required" | "recommended";
}

export interface DependencyEngineData {
  version: string;
  dependencies: DependencyRule[];
}

export interface LeadMagnet {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  checklist: string[];
  relatedProducts: string[];
}
