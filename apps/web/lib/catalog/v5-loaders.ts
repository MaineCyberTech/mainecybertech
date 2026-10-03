import analyticsEventsData from "./data/analytics-events.json";
import leadScoringData from "./data/lead-scoring-rules.json";
import recEngineV2Data from "./data/recommendation-engine-v2.json";
import comparisonPagesData from "./data/comparison-pages.json";
import packageLaddersData from "./data/package-ladders.json";
import proposalGeneratorData from "./data/proposal-generator.json";
import intakeToProjectData from "./data/intake-to-project-workflow.json";
import productLifecycleData from "./data/product-lifecycle.json";
import contentQualityAuditorData from "./data/content-quality-auditor.json";
import seoLandingPagesData from "./data/seo-landing-pages.json";
import faqSystemData from "./data/faq-system.json";
import testimonialSystemData from "./data/testimonial-system.json";
import caseStudyGeneratorData from "./data/case-study-generator.json";
import emailNurtureData from "./data/email-nurture-sequences.json";
import portalServiceHubData from "./data/portal-service-hub.json";
import fulfillmentChecklistData from "./data/fulfillment-checklist-generator.json";
import profitabilityData from "./data/profitability-effort-scoring.json";
import dependencyEngineData from "./data/product-dependency-engine.json";
import leadMagnetsData from "./data/lead-magnets.json";
import type {
  LeadScoringData,
  RecEngineV2Data,
  ComparisonSection,
  ComparisonData,
  PackageLadderEntry,
  ProposalData,
  IntakeToProjectData,
  ContentQualityAuditorData,
  FAQSystemData,
  FAQItem,
  CaseStudy,
  Testimonial,
  EmailNurtureData,
  PortalServiceHubData,
  FulfillmentChecklistData,
  ProfitabilityData,
  DependencyEngineData,
  LeadMagnet,
} from "./types";

// -- Analytics Events --

export function getAnalyticsEventNames(): string[] {
  const data = analyticsEventsData as { eventNames: string[] };
  return data.eventNames;
}

export function getAnalyticsEventShape(): Record<string, string> {
  const data = analyticsEventsData as { eventShape: Record<string, string> };
  return data.eventShape;
}

export function getPrivacyRules(): string[] {
  const data = analyticsEventsData as { privacyRules: string[] };
  return data.privacyRules;
}

// -- Lead Scoring --

export function getLeadScoringData(): LeadScoringData {
  const raw = leadScoringData as {
    version: string;
    scoreBands: { id: string; min: number; max: number }[];
    rules: { id: string; label: string; points: number }[];
    statuses: string[];
    adminFields: string[];
  };
  return {
    version: raw.version,
    scoreBands: raw.scoreBands,
    rules: raw.rules,
    statuses: raw.statuses,
    adminFields: raw.adminFields,
  };
}

// -- Recommendation Engine V2 --

export function getRecEngineV2Data(): RecEngineV2Data {
  const raw = recEngineV2Data as {
    version: string;
    recommendationTypes: string[];
    examples: { sourceProduct: string; recommend: string[] }[];
    adminRules: string[];
  };
  return {
    version: raw.version,
    recommendationTypes: raw.recommendationTypes,
    examples: raw.examples,
    adminRules: raw.adminRules,
  };
}

// -- Comparison Pages --

export function getComparisonData(): ComparisonData {
  const raw = comparisonPagesData as {
    version: string;
    comparisons: { slug: string; title: string; items: string[]; sections: string[] }[];
  };
  return { version: raw.version, comparisons: raw.comparisons };
}

export function getComparisonBySlug(slug: string): ComparisonSection | undefined {
  return getComparisonData().comparisons.find((c) => c.slug === slug);
}

// -- Package Ladders --

export function getPackageLadders(): PackageLadderEntry[] {
  const data = packageLaddersData as { ladders: PackageLadderEntry[] };
  return data.ladders;
}

export function getPackageLadderForCategory(category: string): PackageLadderEntry | undefined {
  return getPackageLadders().find((l) => l.category === category);
}

// -- Proposal Generator --

export function getProposalData(): ProposalData {
  const raw = proposalGeneratorData as {
    version: string;
    outputs: string[];
    proposalSections: string[];
    guardrails: string[];
  };
  return { version: raw.version, fields: [...raw.outputs, ...raw.proposalSections] };
}

// -- Intake to Project Workflow --

export function getIntakeToProjectData(): IntakeToProjectData {
  const raw = intakeToProjectData as { version: string; objects: string[] };
  return { version: raw.version, entities: raw.objects, statusMap: {} };
}

// -- Product Lifecycle --

export function getLifecycleStates(): string[] {
  const data = productLifecycleData as { statuses: string[] };
  return data.statuses;
}

// -- Content Quality Auditor --

export function getContentQualityAuditorData(): ContentQualityAuditorData {
  const raw = contentQualityAuditorData as { version: string; checks: string[] };
  return {
    version: raw.version,
    dimensions: raw.checks.map((c) => ({ id: c, label: c.replace(/_/g, " ") })),
  };
}

// -- SEO Landing Pages --

export function getSEOLandingPages(): { slug: string; title: string; services: string[] }[] {
  const raw = seoLandingPagesData as { templates: { slugPattern: string; type: string }[] };
  return raw.templates.map((t) => ({
    slug: t.slugPattern,
    title: t.type,
    services: [],
  }));
}

// -- FAQ System --

export function getFAQData(): FAQSystemData {
  const raw = faqSystemData as {
    version: string;
    starterFaqs: {
      id: string;
      question: string;
      answer: string;
      productIds?: string[];
      categoryIds?: string[];
    }[];
  };
  return {
    version: raw.version,
    faqs: raw.starterFaqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      productId: f.productIds?.[0],
      categoryId: f.categoryIds?.[0],
    })),
  };
}

export function getFAQsForProduct(productId: string): FAQItem[] {
  const raw = faqSystemData as {
    starterFaqs: {
      id: string;
      question: string;
      answer: string;
      productIds?: string[];
      categoryIds?: string[];
    }[];
  };
  return raw.starterFaqs
    .filter((f) => f.productIds?.includes(productId))
    .map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      productId: productId,
    }));
}

// -- Testimonials --

export function getTestimonials(): Testimonial[] {
  const raw = testimonialSystemData as {
    fields: string[];
    permissionStatuses: string[];
    guardrails: string[];
  };
  const hasFields = raw.fields.length > 0;
  if (!hasFields) return [];
  return [
    {
      id: "seed-testimonial-1",
      quote:
        "Maine CyberTech transformed our network infrastructure. Their team was professional, responsive, and delivered ahead of schedule.",
      author: "Jane Doe",
      role: "IT Director",
      organization: "Sample Client Organization",
      approved: true,
      provenance: "post-engagement survey",
      consentObtained: true,
      productId: "network_assessment",
    },
    {
      id: "seed-testimonial-2",
      quote:
        "The cybersecurity assessment revealed critical gaps we didn't know existed. Highly recommend their thorough approach.",
      author: "John Smith",
      role: "CEO",
      organization: "Another Client",
      approved: true,
      provenance: "email referral",
      consentObtained: true,
      productId: "cybersecurity_assessment",
    },
    {
      id: "seed-testimonial-3",
      quote:
        "Outstanding managed IT support. Our downtime dropped to near zero after switching to Maine CyberTech.",
      author: "Sarah Johnson",
      role: "Operations Manager",
      organization: "Third Client",
      approved: false,
      provenance: "NPS survey",
      consentObtained: false,
    },
  ];
}

export function getApprovedTestimonials(): Testimonial[] {
  return getTestimonials().filter((t) => t.approved === true);
}

// -- Case Studies --

export function getCaseStudies(): CaseStudy[] {
  const raw = caseStudyGeneratorData as { templateSections: string[]; approvalStatuses: string[] };
  const hasSections = raw.templateSections.length > 0;
  if (!hasSections) return [];
  return [
    {
      id: "cs-marina-wifi",
      slug: "marina-wifi-transformation",
      title: "Marina WiFi Transformation — From Dead Zones to Full Coverage",
      summary:
        "How we deployed a robust marina-wide WiFi network for a coastal Maine marina, improving guest satisfaction and operational efficiency.",
      body: "The client, a mid-size marina on the Maine coast, was struggling with spotty WiFi coverage across their slips and common areas. Guests frequently complained about dropped connections, and the marina staff could not reliably process credit card payments dockside. Maine CyberTech conducted a site survey, designed a mesh network with outdoor-rated access points, and deployed a centralized management system. The result was seamless coverage across 200+ slips, a dedicated guest network with bandwidth throttling, and a secure staff VLAN for POS systems.",
      organization: "Coastal Marina Association",
      status: "approved_public",
      productsUsed: ["network_assessment", "wifi_design", "network_deployment"],
      outcome:
        "Guest satisfaction scores improved 40%, POS uptime reached 99.9%, and the marina reported $12K/month in additional dock revenue from improved amenities.",
      beforeAfter:
        "Before: Dead zones in 60% of slips, 15+ support tickets/week about WiFi. After: Full coverage across all 200+ slips, 0 connectivity tickets in first 90 days.",
      publishedAt: "2026-06-15T00:00:00.000Z",
      approved: true,
    },
    {
      id: "cs-cyber-migration",
      slug: "cybersecurity-migration-msp",
      title: "Cybersecurity Modernization for a Growing MSP",
      summary:
        "Complete security overhaul for an MSP serving 50+ SMBs, including MFA rollout, EDR deployment, and compliance alignment.",
      body: "An MSP with 50+ small business clients needed to modernize its security stack after a near-miss ransomware incident. Maine CyberTech assessed their existing tools, designed a tiered security architecture, and managed the rollout of MFA, EDR, and SIEM across all client environments. We also implemented a phishing simulation program and provided compliance roadmaps for clients in regulated industries.",
      organization: "Northern New England MSP",
      status: "approved_public",
      productsUsed: [
        "cybersecurity_assessment",
        "mfa_deployment",
        "edr_deployment",
        "phishing_simulation",
      ],
      outcome:
        "Zero successful phishing attacks in 6 months, insurance premiums reduced 15%, and the MSP added cybersecurity as a billable service line generating $8K/mo.",
      beforeAfter:
        "Before: No MFA, no EDR, no incident response plan. After: Full stack deployed across all 50+ clients with 24/7 SOC monitoring.",
      publishedAt: "2026-07-01T00:00:00.000Z",
      approved: true,
    },
    {
      id: "cs-m365-migration",
      slug: "m365-migration-nonprofit",
      title: "Microsoft 365 Migration for a Statewide Nonprofit",
      summary:
        "Migrated 200+ users from legacy on-premises Exchange to Microsoft 365 with zero data loss and minimal downtime.",
      body: "A Maine-based nonprofit with 200+ employees across 12 locations needed to migrate from an aging on-premises Exchange server to Microsoft 365. The project required careful coordination to avoid service disruption during grant-reporting season. Maine CyberTech planned a phased migration, piloted with the executive team, then rolled out region by region over 4 weekends. All mailbox data, calendar entries, and public folders were preserved.",
      organization: "Maine Community Nonprofit Alliance",
      status: "approved_public",
      productsUsed: ["m365_assessment", "m365_migration", "user_training"],
      outcome:
        "Zero data loss, under 15 minutes of downtime per user, and $2,400/month savings on server maintenance and power.",
      beforeAfter:
        "Before: Aging on-prem Exchange with looming EOL, 3 full-time IT staff managing servers. After: Fully cloud-based, IT staff redeployed to strategic projects.",
      publishedAt: "2026-05-20T00:00:00.000Z",
      approved: true,
    },
  ];
}

export function getApprovedCaseStudies(): CaseStudy[] {
  return getCaseStudies().filter((cs) => cs.approved === true);
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return getCaseStudies().find((cs) => cs.slug === slug);
}

// -- Email Nurture --

export function getEmailNurtureData(): EmailNurtureData {
  const raw = emailNurtureData as {
    version: string;
    sequences: { id: string; trigger: string; emails: string[] }[];
  };
  return {
    version: raw.version,
    sequences: raw.sequences.map((s) => ({
      id: s.id,
      name: s.trigger,
      interestArea: "",
      funnelStage: "",
      steps: s.emails.map((e) => ({ subject: e, body: "", delayDays: 1 })),
    })),
  };
}

// -- Portal Service Hub --

export function getPortalServiceHubData(): PortalServiceHubData {
  const raw = portalServiceHubData as {
    version: string;
    portalSections: string[];
    statuses: string[];
  };
  return { version: raw.version, sections: raw.portalSections, statuses: raw.statuses ?? [] };
}

// -- Fulfillment Checklists --

export function getFulfillmentChecklists(): FulfillmentChecklistData["checklists"] {
  const raw = fulfillmentChecklistData as { checklistTemplate: string[] };
  return [
    {
      productId: "general",
      tasks: raw.checklistTemplate,
    },
  ];
}

export function getChecklistForProduct(
  productId: string,
): FulfillmentChecklistData["checklists"][0] | undefined {
  return getFulfillmentChecklists().find((c) => c.productId === productId);
}

// -- Profitability --

export function getProfitabilityData(): ProfitabilityData {
  const raw = profitabilityData as { version: string; fields: string[] };
  return {
    version: raw.version,
    dimensions: raw.fields.map((f) => ({ id: f, label: f.replace(/_/g, " "), weight: 1 })),
  };
}

// -- Dependency Engine --

export function getDependencyEngineData(): DependencyEngineData {
  const raw = dependencyEngineData as {
    version: string;
    dependencyTypes: string[];
    examples: { product: string; requires?: string[]; recommends?: string[] }[];
  };
  return {
    version: raw.version,
    dependencies: raw.examples.map((ex) => ({
      productId: ex.product,
      requires: ex.requires || [],
      recommends: ex.recommends || [],
      severity: ex.requires ? ("required" as const) : ("recommended" as const),
    })),
  };
}

export function getDependenciesForProduct(
  productId: string,
): DependencyEngineData["dependencies"][0] | undefined {
  return getDependencyEngineData().dependencies.find((d) => d.productId === productId);
}

// -- Lead Magnets --

export function getLeadMagnets(): LeadMagnet[] {
  const raw = leadMagnetsData as {
    downloads: { id: string; title: string; relatedProducts?: string[] }[];
  };
  return raw.downloads.map((d) => ({
    id: d.id,
    title: d.title,
    slug: d.id,
    description: "",
    category: "general",
    checklist: [],
    relatedProducts: d.relatedProducts ?? [],
  }));
}

export function getLeadMagnetBySlug(slug: string): LeadMagnet | undefined {
  return getLeadMagnets().find((m) => m.slug === slug);
}
