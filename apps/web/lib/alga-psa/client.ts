import "server-only";
import { randomUUID } from "node:crypto";
import type { AlgaPsaIntakeConfig } from "./config";

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
    priority_id: input.config.priorityId,
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
 * Create one intake ticket in Alga PSA. No retry is attempted here: a retry of
 * a non-idempotent create can duplicate a ticket. The caller owns the
 * user-facing error path and must not fall back to a second system of record.
 */
export async function createIntakeTicket(
  input: CreateIntakeTicketInput,
  fetchImpl: typeof fetch = fetch,
): Promise<AlgaIntakeTicket> {
  const externalId = input.externalId?.trim() || randomUUID();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ALGA_PSA_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetchImpl(`${input.config.baseUrl}/tickets`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "x-api-key": input.config.apiKey,
        },
        body: JSON.stringify(buildTicketBody(input, externalId)),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new AlgaPsaError("Alga PSA ticket intake timed out.", 504);
      }
      throw new AlgaPsaError("Alga PSA ticket intake could not be reached.", 502);
    }

    const rawBody = await response.text().catch(() => "");
    let payload: unknown = null;
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const errorPayload = (payload as { error?: { code?: unknown } } | null)?.error;
      const code = typeof errorPayload?.code === "string" ? errorPayload.code : undefined;
      throw new AlgaPsaError(
        `Alga PSA rejected ticket intake (HTTP ${response.status}${code ? ` ${code}` : ""}).`,
        response.status,
        code,
      );
    }

    const data = ((payload as { data?: unknown } | null)?.data ?? payload) as Record<
      string,
      unknown
    > | null;
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
  } finally {
    clearTimeout(timeout);
  }
}
