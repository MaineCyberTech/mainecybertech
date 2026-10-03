/**
 * Proposal-draft generation for store quote requests.
 *
 * Wires `store_proposal_drafts` (previously an unwired table). Sections follow
 * `proposal-generator.json` in the web catalog pack; guardrails from that file
 * are enforced here (drafts only, human review required).
 */
import type { CatalogProduct } from "./store-catalog";

export const PROPOSAL_SECTIONS = [
  "Executive summary",
  "Current situation",
  "Recommended services",
  "Scope by phase",
  "What is included",
  "What is not included",
  "Assumptions",
  "Customer responsibilities",
  "Optional add-ons",
  "Monthly care path",
  "Next steps",
] as const;

export const PROPOSAL_GUARDRAILS = [
  "Mark generated proposals as drafts",
  "Require human review before sending",
  "Do not guarantee compliance/security outcomes",
  "Do not include secrets or sensitive intake text unnecessarily",
];

export interface QuoteRequestCustomer {
  name?: string;
  email?: string;
  phone?: string | null;
}

export interface QuoteRequestItem {
  productId?: string;
  name?: string;
  priceRange?: string;
}

export interface QuoteRequestLike {
  id: string;
  customer?: unknown;
  items?: unknown;
  notes?: string | null;
}

export interface ProposalDraftSections {
  [section: string]: string[];
}

function asCustomer(value: unknown): QuoteRequestCustomer {
  return value && typeof value === "object" ? (value as QuoteRequestCustomer) : {};
}

function asItems(value: unknown): QuoteRequestItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) =>
    typeof item === "string" ? { productId: item } : ((item ?? {}) as QuoteRequestItem),
  );
}

function findProduct(
  products: CatalogProduct[],
  item: QuoteRequestItem,
): CatalogProduct | undefined {
  return products.find(
    (p) =>
      (item.productId && (p.id === item.productId || p.slug === item.productId)) ||
      (item.name && p.name === item.name),
  );
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function label(item: QuoteRequestItem): string {
  return item.name || item.productId || "Service";
}

export function buildProposalSections(
  request: QuoteRequestLike,
  products: CatalogProduct[],
): ProposalDraftSections {
  const customer = asCustomer(request.customer);
  const items = asItems(request.items);
  const matched = items.map((item) => ({ item, product: findProduct(products, item) }));

  const included = matched.flatMap(({ product }) =>
    stringList((product?.attributes as Record<string, unknown> | undefined)?.whatIsIncluded),
  );
  const notIncluded = matched.flatMap(({ product }) =>
    stringList((product?.attributes as Record<string, unknown> | undefined)?.whatIsNotIncluded),
  );
  const prerequisites = matched.flatMap(({ product }) =>
    stringList((product?.attributes as Record<string, unknown> | undefined)?.customerPrerequisites),
  );
  const addOns = matched.flatMap(({ product }) =>
    stringList((product?.attributes as Record<string, unknown> | undefined)?.addOns),
  );

  const hasMonthlyPlan = matched.some(({ item, product }) =>
    [item.productId, item.name, product?.categoryId]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes("monthly")),
  );

  return {
    "Executive summary": [
      `Draft proposal for ${customer.name || "the customer"}.`,
      `Prepared from quote request ${request.id}.`,
      `${items.length} service${items.length === 1 ? "" : "s"} requested.`,
    ],
    "Current situation": [
      request.notes?.trim()
        ? `Customer notes: ${request.notes.trim()}`
        : "No customer notes supplied.",
    ],
    "Recommended services": items.length
      ? matched.map(({ item }) => `${label(item)}${item.priceRange ? ` — ${item.priceRange}` : ""}`)
      : ["No services selected."],
    "Scope by phase": matched.map(({ item }) => `${label(item)}: confirm scope during onboarding.`),
    "What is included": included.length ? included : ["To be confirmed from the service catalog."],
    "What is not included": notIncluded.length ? notIncluded : ["To be confirmed during review."],
    Assumptions: [
      "Pricing reflects the current published catalog and may change after discovery.",
      "Access, licensing, and hardware prerequisites are supplied by the customer.",
    ],
    "Customer responsibilities": prerequisites.length
      ? prerequisites
      : ["Provide timely access and a primary point of contact."],
    "Optional add-ons": addOns.length ? addOns : ["No add-ons recommended at this stage."],
    "Monthly care path": [
      hasMonthlyPlan
        ? "A recurring monthly plan is already included in this request."
        : "Consider a monthly care plan for ongoing coverage.",
    ],
    "Next steps": [
      "Review this draft internally and adjust scope or pricing.",
      "Send the reviewed proposal to the customer.",
      "On approval, create the project and onboarding checklist.",
    ],
  };
}
