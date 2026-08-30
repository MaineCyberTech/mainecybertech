import products from "./data/products.json";
import categories from "./data/categories.json";
import bundleRules from "./data/bundle-rules.json";
import promoData from "./data/promo-rules.json";
import trustBadgesData from "./data/trust-badges.json";
import visualServiceMapData from "./data/visual-service-map.json";
import seasonalCampaignsData from "./data/seasonal-campaigns.json";
import serviceFinderQuizData from "./data/service-finder-quiz.json";
import bundleSavingsCalculatorData from "./data/bundle-savings-calculator.json";
import type { CatalogProduct, Category, BundleRule } from "./types";
import type {
  PromoRules,
  TrustBadgesData,
  VisualServiceMap,
  SeasonalCampaignsData,
  SeasonalCampaign,
  ServiceFinderQuiz,
  QuizQuestion,
  BundleSavingsCalculator,
  BundleValuePanelField,
} from "./types";

function castProducts(): CatalogProduct[] {
  return products as unknown as CatalogProduct[];
}

function castCategories(): Category[] {
  return categories as unknown as Category[];
}

function castBundleRules(): BundleRule[] {
  return (bundleRules as unknown as { recommendationRules: BundleRule[] }).recommendationRules;
}

export function getAllProducts(): CatalogProduct[] {
  return castProducts();
}

export function getVisibleProducts(): CatalogProduct[] {
  return castProducts().filter((p) => p.display === true);
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return castProducts().find((p) => p.slug === slug);
}

export function getProductById(id: string): CatalogProduct | undefined {
  return castProducts().find((p) => p.id === id);
}

export function getProductsByCategory(categoryId: string): CatalogProduct[] {
  return castProducts().filter((p) => p.categoryId === categoryId);
}

export function getCategories(): Category[] {
  return castCategories();
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return castCategories().find((c) => c.slug === slug);
}

export function getBundleRules(): BundleRule[] {
  return castBundleRules();
}

export function getCategoryOrder(): string[] {
  return (bundleRules as unknown as { publicCategoryOrder: string[] }).publicCategoryOrder;
}

export function getFeaturedProducts(): CatalogProduct[] {
  return castProducts().filter((p) => p.tags.includes("quick-win") && p.display === true);
}

export function getMonthlyPlans(): CatalogProduct[] {
  return castProducts().filter((p) => p.categoryId === "monthly-it-plans");
}

export function getEmergencyProducts(): CatalogProduct[] {
  return castProducts().filter((p) => p.categoryId === "emergency-support");
}

export function getProductCount(): number {
  return castProducts().length;
}

export function getVisibleProductCount(): number {
  return getVisibleProducts().length;
}

export function getHiddenProductCount(): number {
  return castProducts().filter((p) => p.display === false).length;
}

export function getCategoryCount(): number {
  return castCategories().length;
}

// --- Conversion Module Loaders ---

export function getPromoRules(): PromoRules {
  return promoData as PromoRules;
}

export function getTrustBadges(): TrustBadgesData {
  return trustBadgesData as TrustBadgesData;
}

export function getVisualServiceMap(): VisualServiceMap {
  return visualServiceMapData as VisualServiceMap;
}

export function getSeasonalCampaigns(): SeasonalCampaignsData {
  return seasonalCampaignsData as SeasonalCampaignsData;
}

export function getActiveCampaigns(): SeasonalCampaign[] {
  const data = seasonalCampaignsData as SeasonalCampaignsData;
  return data.campaigns;
}

export function getServiceFinderQuiz(): ServiceFinderQuiz {
  return serviceFinderQuizData as ServiceFinderQuiz;
}

export function getQuizQuestions(): QuizQuestion[] {
  const data = serviceFinderQuizData as ServiceFinderQuiz;
  return data.questions;
}

export function getBundleSavingsCalculator(): BundleSavingsCalculator {
  return bundleSavingsCalculatorData as BundleSavingsCalculator;
}

export function getBundleValuePanels(): BundleValuePanelField[] {
  const data = bundleSavingsCalculatorData as BundleSavingsCalculator;
  return data.exampleBundleValuePanels;
}

// Re-export V5 module loaders from v5-loaders.ts so direct imports from loader.ts resolve
export {
  getAnalyticsEventNames,
  getAnalyticsEventShape,
  getPrivacyRules,
  getLeadScoringData,
  getRecEngineV2Data,
  getComparisonData,
  getComparisonBySlug,
  getPackageLadders,
  getPackageLadderForCategory,
  getProposalData,
  getIntakeToProjectData,
  getLifecycleStates,
  getContentQualityAuditorData,
  getSEOLandingPages,
  getFAQData,
  getFAQsForProduct,
  getTestimonials,
  getApprovedTestimonials,
  getCaseStudies,
  getApprovedCaseStudies,
  getCaseStudyBySlug,
  getEmailNurtureData,
  getPortalServiceHubData,
  getFulfillmentChecklists,
  getChecklistForProduct,
  getProfitabilityData,
  getDependencyEngineData,
  getDependenciesForProduct,
  getLeadMagnets,
  getLeadMagnetBySlug,
} from "./v5-loaders";
