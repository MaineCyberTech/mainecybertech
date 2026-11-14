import "server-only";
import { randomUUID } from "node:crypto";
import {
  PORTAL_TICKET_PRIORITIES,
  type AlgaPsaIntakeConfig,
  type PortalTicketPriority,
} from "./config";

/**
 * Alga PSA's built-in external-system key for the client portal. The ADR calls
 * this system `portal`, but Alga only accepts built-in keys or
 * `custom:<slug>` keys. `client_portal` is in Alga's
 * `BUILT_IN_EXTERNAL_SYSTEMS` registry and renders the portal origin badge, so
 * the request uses it rather than a key the tenant would have to invent.
 * It has no URL template, which is why every link supplies an explicit URL.
 */
export const ALGA_PSA_EXTERNAL_SYSTEM = "client_portal";

/** Bound the upstream call so a hung PSA cannot hold a portal action open. */
export const ALGA_PSA_TIMEOUT_MS = 10_000;

/**
 * An upstream failure. The message is safe to surface to server logs but must
 * not be shown verbatim to portal users. It never contains the API key,
 * request body or response body.
 */
export class AlgaPsaError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AlgaPsaError";
    this.status = status;
    this.code = code;
  }
}

export interface AlgaIntakeTicket {
  id: string;
  number: string | null;
  title: string | null;
}

export interface CreateIntakeTicketInput {
  config: AlgaPsaIntakeConfig;
  title: string;
  description?: string | null;
  portalOrganizationId: string;
  portalPriority?: string | null;
  portalCategory?: string | null;
  /** Absolute portal origin used in the external link, e.g. https://app.example. */
  portalBaseUrl?: string | null;
  /**
   * Stable idempotency key. The caller may supply one when it can reuse it
   * across retries; otherwise a fresh UUID is generated for this submission.
   */
  externalId?: string;
}

export interface FindIntakeTicketInput {
  config: AlgaPsaIntakeConfig;
  /** The same key supplied to `createIntakeTicket` as `externalId`. */
  externalId: string;
}

/** Resolve the PSA priority for a portal priority, falling back to the default. */
export function resolvePriorityId(
  config: AlgaPsaIntakeConfig,
  portalPriority?: string | null,
): string {
  const key = typeof portalPriority === "string" ? portalPriority.trim().toLowerCase() : "";
  if (config.priorityMap && (PORTAL_TICKET_PRIORITIES as readonly string[]).includes(key)) {
    return config.priorityMap[key as PortalTicketPriority];
  }
  return config.priorityId;
}

function normalizeExternalId(externalId?: string): string {
  return externalId?.trim() || randomUUID();
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function portalOrigin(input: CreateIntakeTicketInput): string {
  const raw =
    input.portalBaseUrl?.trim() || process.env.APP_BASE_URL || "https://app.mainecybertech.us";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "https://app.mainecybertech.us";
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return "https://app.mainecybertech.us";
  }
}

function buildTicketBody(input: CreateIntakeTicketInput, externalId: string) {
  // Alga's ticket create schema has no `description` column. Its ticket API and
  // UI treat `attributes.description` as the canonical rich-text description
  // (`TicketService.withDescriptionHtml` -> `renderTicketDescriptionHtml`, and
  // the BentoHero/TicketInfo editors read the same field), so the customer's
  // text goes there instead of an extra comment that would duplicate it.
  const attributes: Record<string, unknown> = {
    portal_organization_id: input.portalOrganizationId,
    portal_external_id: externalId,
    portal_submitted_at: new Date().toISOString(),
  };
  const description = input.description?.trim();
  if (description) attributes.description = description;
  if (input.portalPriority?.trim()) attributes.portal_priority = input.portalPriority.trim();
  if (input.portalCategory?.trim()) attributes.portal_category = input.portalCategory.trim();

  return {
    title: input.title.trim(),
    board_id: input.config.boardId,
    client_id: input.config.clientId,
    status_id: input.config.statusId,
    priority_id: resolvePriorityId(input.config, input.portalPriority),
    attributes,
    external_links: [
      {
        system: ALGA_PSA_EXTERNAL_SYSTEM,
        external_id: externalId,
        relationship: "origin" as const,
        realm: input.portalOrganizationId,
        url: `${portalOrigin(input)}/portal/support`,
        metadata: {
          portal_organization_id: input.portalOrganizationId,
          portal_priority: input.portalPriority?.trim() || null,
          portal_category: input.portalCategory?.trim() || null,
        },
      },
    ],
  };
}

/**
 * Perform one bounded PSA request. A hung PSA must not hold a portal action
 * open, and a transport failure must surface as a safe gateway error.
 */
async function requestWithTimeout(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
  timeoutMessage: string,
  unreachableMessage: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ALGA_PSA_TIMEOUT_MS);
  try {
    try {
      return await fetchImpl(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new AlgaPsaError(timeoutMessage, 504);
      }
      throw new AlgaPsaError(unreachableMessage, 502);
    }
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonBody(rawBody: string): unknown {
  try {
    return rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return null;
  }
}

function unwrapData(payload: unknown): Record<string, unknown> | null {
  return ((payload as { data?: unknown } | null)?.data ?? payload) as Record<
    string,
    unknown
  > | null;
}

function rejectedError(response: Response, payload: unknown, action: string): AlgaPsaError {
  const errorPayload = (payload as { error?: { code?: unknown } } | null)?.error;
  const code = typeof errorPayload?.code === "string" ? errorPayload.code : undefined;
  return new AlgaPsaError(
    `Alga PSA rejected ${action} (HTTP ${response.status}${code ? ` ${code}` : ""}).`,
    response.status,
    code,
  );
}

/**
 * Create one intake ticket in Alga PSA. No retry is attempted here: a retry of
 * a non-idempotent create can duplicate a ticket. The caller owns the
 * user-facing error path and must not fall back to a second system of record.
 */
export async function createIntakeTicket(
  input: CreateIntakeTicketInput,
  fetchImpl: typeof fetch = fetch,
): Promise<AlgaIntakeTicket> {
  const externalId = normalizeExternalId(input.externalId);
  const response = await requestWithTimeout(
    `${input.config.baseUrl}/tickets`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-api-key": input.config.apiKey,
      },
      body: JSON.stringify(buildTicketBody(input, externalId)),
    },
    fetchImpl,
    "Alga PSA ticket intake timed out.",
    "Alga PSA ticket intake could not be reached.",
  );

  const payload = parseJsonBody(await response.text().catch(() => ""));
  if (!response.ok) {
    throw rejectedError(response, payload, "ticket intake");
  }

  const data = unwrapData(payload);
  const id =
    stringOrNull(data?.ticket_id) ?? stringOrNull(data?.id) ?? stringOrNull(data?.ticketId);
  if (!id) {
    throw new AlgaPsaError("Alga PSA ticket intake returned no ticket id.", 502);
  }

  return {
    id,
    number: stringOrNull(data?.ticket_number) ?? stringOrNull(data?.number),
    title: stringOrNull(data?.title),
  };
}

/**
 * Look up the ticket that already carries `externalId` on the `client_portal`
 * external system. Returns null only for a definitive 404; every other failure
 * is thrown so the caller can fail closed instead of creating a duplicate.
 */
export async function findIntakeTicket(
  input: FindIntakeTicketInput,
  fetchImpl: typeof fetch = fetch,
): Promise<AlgaIntakeTicket | null> {
  const externalId = input.externalId.trim();
  if (!externalId) {
    throw new AlgaPsaError("Alga PSA ticket lookup requires an external id.", 400);
  }

  const query = new URLSearchParams({
    system: ALGA_PSA_EXTERNAL_SYSTEM,
    external_id: externalId,
  });
  const response = await requestWithTimeout(
    `${input.config.baseUrl}/tickets/by-external-link?${query.toString()}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": input.config.apiKey,
      },
    },
    fetchImpl,
    "Alga PSA ticket lookup timed out.",
    "Alga PSA ticket lookup could not be reached.",
  );

  // 404 is the documented "no ticket carries that external record" answer.
  if (response.status === 404) return null;

  const payload = parseJsonBody(await response.text().catch(() => ""));
  if (!response.ok) {
    throw rejectedError(response, payload, "ticket lookup");
  }

  const data = unwrapData(payload);
  const id =
    stringOrNull(data?.ticket_id) ?? stringOrNull(data?.id) ?? stringOrNull(data?.ticketId);
  if (!id) {
    throw new AlgaPsaError("Alga PSA ticket lookup returned no ticket id.", 502);
  }

  return {
    id,
    number: stringOrNull(data?.ticket_number) ?? stringOrNull(data?.number),
    title: stringOrNull(data?.title),
  };
}

/**
 * Idempotent intake: return the existing ticket for a repeated submission,
 * otherwise create one. A create that races another request (409
 * `duplicate_external_link`) is resolved by looking up the winner.
 *
 * A lookup failure is deliberately not treated as "not found": creating on an
 * unverified key is exactly how a retry duplicates a ticket.
 */
export async function ensureIntakeTicket(
  input: CreateIntakeTicketInput,
  fetchImpl: typeof fetch = fetch,
): Promise<AlgaIntakeTicket> {
  const externalId = normalizeExternalId(input.externalId);
  const existing = await findIntakeTicket({ config: input.config, externalId }, fetchImpl);
  if (existing) return existing;

  try {
    return await createIntakeTicket({ ...input, externalId }, fetchImpl);
  } catch (error) {
    if (
      error instanceof AlgaPsaError &&
      error.status === 409 &&
      error.code === "duplicate_external_link"
    ) {
      const winner = await findIntakeTicket({ config: input.config, externalId }, fetchImpl);
      if (winner) return winner;
    }
    throw error;
  }
}
