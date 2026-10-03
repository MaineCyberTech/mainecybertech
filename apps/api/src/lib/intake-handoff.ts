/**
 * Intake → project handoff.
 *
 * Implements the `intake-to-project-workflow.json` flow for store quote
 * requests: quote request → project → task checklist → ticket, with the source
 * rows flipped to `converted`. The builders here are pure so they can be
 * unit-tested; the route performs the inserts.
 */

/** Mirrors `fulfillment-checklist-generator.json` → `checklistTemplate`. */
export const FULFILLMENT_CHECKLIST = [
  "Review intake",
  "Confirm scope",
  "Confirm safe access method",
  "Perform service-specific work",
  "Document findings/changes",
  "QA review",
  "Send customer summary",
  "Recommend next service",
  "Close temporary access if applicable",
];

export interface HandoffCustomer {
  name?: string;
  email?: string;
}

export interface HandoffItem {
  productId?: string;
  name?: string;
  priceRange?: string;
}

export interface HandoffQuoteRequest {
  id: string;
  customer?: unknown;
  items?: unknown;
  notes?: string | null;
}

export interface HandoffOptions {
  organizationId: string;
  createdBy: string;
  projectName?: string;
  priority?: string;
  ownerId?: string | null;
}

export interface ProjectInsertPlan {
  organization_id: string;
  created_by: string;
  owner_id: string | null;
  name: string;
  description: string;
  status: "planned";
  priority: string;
  metadata: Record<string, unknown>;
}

export interface HandoffPlan {
  project: ProjectInsertPlan;
  taskTitles: string[];
  ticketTitle: string;
  ticketDescription: string;
}

export function asHandoffCustomer(value: unknown): HandoffCustomer {
  return value && typeof value === "object" ? (value as HandoffCustomer) : {};
}

export function asHandoffItems(value: unknown): HandoffItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) =>
    typeof item === "string" ? { productId: item } : ((item ?? {}) as HandoffItem),
  );
}

function itemLabel(item: HandoffItem): string {
  return item.name || item.productId || "Service";
}

export { itemLabel as handoffItemLabel };

/**
 * Extracts a numeric amount from a catalog price range such as `"$1,200"`,
 * `"From $500"` or `"$99/mo"`. Returns 0 when no amount is present.
 */
export function parseAmountFromPriceRange(priceRange?: string): number {
  if (!priceRange) return 0;
  const match = priceRange.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

/** Proposal title for the first-class `proposals` row created from a request. */
export function buildProposalTitle(request: HandoffQuoteRequest): string {
  const customer = asHandoffCustomer(request.customer);
  return customer.name
    ? `${customer.name} — proposal`
    : `Store intake proposal ${request.id.slice(0, 8)}`;
}

export function buildHandoffPlan(
  request: HandoffQuoteRequest,
  options: HandoffOptions,
): HandoffPlan {
  const customer = asHandoffCustomer(request.customer);
  const items = asHandoffItems(request.items);
  const priority = options.priority ?? "normal";

  const projectName =
    options.projectName?.trim() ||
    (customer.name ? `${customer.name} — Store intake` : `Store intake ${request.id.slice(0, 8)}`);

  const itemLines = items.length
    ? items.map((item) => `- ${itemLabel(item)}${item.priceRange ? ` (${item.priceRange})` : ""}`)
    : ["- (no services selected)"];

  const description = [
    `Created from store quote request ${request.id}.`,
    "",
    "Requested services:",
    ...itemLines,
    ...(request.notes?.trim() ? ["", `Customer notes: ${request.notes.trim()}`] : []),
  ].join("\n");

  return {
    project: {
      organization_id: options.organizationId,
      created_by: options.createdBy,
      owner_id: options.ownerId ?? null,
      name: projectName,
      description,
      status: "planned",
      priority,
      metadata: { quoteRequestId: request.id, source: "store_intake" },
    },
    taskTitles: [...FULFILLMENT_CHECKLIST],
    ticketTitle: `Store intake handoff: ${projectName}`,
    ticketDescription: [
      `Fulfilment ticket for store quote request ${request.id}.`,
      `Project: ${projectName}`,
      "",
      "Requested services:",
      ...itemLines,
    ].join("\n"),
  };
}
