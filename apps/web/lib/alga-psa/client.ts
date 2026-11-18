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

/**
 * The portal user attributes that map to an Alga PSA contact. Only client
 * users become contacts; MCT staff stay PSA users and never reach this path.
 */
export interface AlgaPortalContactInput {
  fullName: string;
  email: string;
  phone?: string | null;
  /** Portal profile job title; stored as the PSA contact `role`. */
  title?: string | null;
}

export interface AlgaContact {
  id: string;
  fullName: string | null;
  email: string | null;
}

export interface CreateIntakeTicketInput {
  config: AlgaPsaIntakeConfig;
  title: string;
  description?: string | null;
  portalOrganizationId: string;
  /** Authenticated portal user UUID, recorded as a non-PII audit attribute. */
  portalUserId?: string | null;
  portalPriority?: string | null;
  portalCategory?: string | null;
  /**
   * Portal client user to attribute the ticket to. The adapter resolves or
   * creates the matching PSA contact under the configured PSA client.
   */
  portalContact?: AlgaPortalContactInput | null;
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
  /**
   * When set, a link whose `realm` names a different portal organization is
   * treated as a collision instead of being returned.
   */
  portalOrganizationId?: string | null;
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function buildTicketBody(
  input: CreateIntakeTicketInput,
  externalId: string,
  contactNameId?: string | null,
) {
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
  const portalUserId = input.portalUserId?.trim();
  if (portalUserId) attributes.portal_user_id = portalUserId;
  if (input.portalPriority?.trim()) attributes.portal_priority = input.portalPriority.trim();
  if (input.portalCategory?.trim()) attributes.portal_category = input.portalCategory.trim();

  const resolvedContactNameId = contactNameId?.trim();

  return {
    title: input.title.trim(),
    board_id: input.config.boardId,
    client_id: input.config.clientId,
    ...(resolvedContactNameId ? { contact_name_id: resolvedContactNameId } : {}),
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
 * The Alga contact list is filterable by `email`, but the filter is an ILIKE
 * prefix/substring match. Only an exact normalized email is a valid match: a
 * different address must never be attached to the portal user's ticket.
 */
function contactRows(payload: unknown): Array<Record<string, unknown>> {
  const candidate = Array.isArray(payload) ? payload : (payload as { data?: unknown } | null)?.data;
  return Array.isArray(candidate) ? candidate.filter(isRecord) : [];
}

function contactFromRow(
  row: Record<string, unknown>,
  fallback?: AlgaPortalContactInput,
): AlgaContact | null {
  const id = stringOrNull(row.contact_name_id) ?? stringOrNull(row.id);
  if (!id) return null;
  return {
    id,
    fullName: stringOrNull(row.full_name) ?? fallback?.fullName.trim() ?? null,
    email: stringOrNull(row.email) ?? fallback?.email.trim() ?? null,
  };
}

function isDuplicateContactResponse(status: number, payload: unknown): boolean {
  if (status === 409) return true;
  if (status !== 400) return false;

  const error = (payload as { error?: Record<string, unknown> } | null)?.error;
  const code = typeof error?.code === "string" ? error.code.toLowerCase() : "";
  if (code === "conflict" || code.includes("duplicate") || code.includes("exists")) {
    return true;
  }
  const message = typeof error?.message === "string" ? error.message : "";
  const details = typeof error?.details === "string" ? error.details : "";
  return /duplicate|already exists|email_exists/i.test(`${message} ${details}`);
}

/**
 * Find a PSA contact by exact, case-insensitive email under the configured PSA
 * client. Returns null when no contact matches; every upstream failure is
 * thrown so the caller can fail closed.
 */
export async function findContact(
  config: AlgaPsaIntakeConfig,
  email: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AlgaContact | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new AlgaPsaError("Alga PSA contact lookup requires an email.", 400);
  }

  const query = new URLSearchParams({
    client_id: config.clientId,
    email: normalizedEmail,
    limit: "10",
  });
  const response = await requestWithTimeout(
    `${config.baseUrl}/contacts?${query.toString()}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-api-key": config.apiKey,
      },
    },
    fetchImpl,
    "Alga PSA contact lookup timed out.",
    "Alga PSA contact lookup could not be reached.",
  );

  if (response.status === 404) {
    await response.text().catch(() => "");
    return null;
  }

  const payload = parseJsonBody(await response.text().catch(() => ""));
  if (!response.ok) {
    throw rejectedError(response, payload, "contact lookup");
  }

  for (const row of contactRows(payload)) {
    const rowEmail = stringOrNull(row.email);
    if (!rowEmail || normalizeEmail(rowEmail) !== normalizedEmail) continue;
    // The list is filtered by client_id server-side, but do not attach a
    // contact that the response explicitly places under another client.
    const rowClientId = stringOrNull(row.client_id);
    if (rowClientId && rowClientId !== config.clientId) continue;
    const contact = contactFromRow(row);
    if (contact) return contact;
  }
  return null;
}

/**
 * Create one contact under the configured PSA client. A duplicate is surfaced
 * as `duplicate_contact` so `ensureContact` can re-query the winner; every
 * other rejection is a hard failure.
 */
async function createContact(
  config: AlgaPsaIntakeConfig,
  contact: AlgaPortalContactInput,
  fetchImpl: typeof fetch,
): Promise<AlgaContact> {
  const fullName = contact.fullName.trim();
  const email = contact.email.trim();
  const body: Record<string, unknown> = {
    full_name: fullName,
    email,
    client_id: config.clientId,
  };
  const role = contact.title?.trim();
  if (role) body.role = role;
  const phone = contact.phone?.trim();
  if (phone) {
    // Alga requires a canonical (or custom) type on every phone row.
    body.phone_numbers = [{ phone_number: phone, canonical_type: "work", is_default: true }];
  }

  const response = await requestWithTimeout(
    `${config.baseUrl}/contacts`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify(body),
    },
    fetchImpl,
    "Alga PSA contact sync timed out.",
    "Alga PSA contact sync could not be reached.",
  );

  const payload = parseJsonBody(await response.text().catch(() => ""));
  if (!response.ok) {
    const error = rejectedError(response, payload, "contact create");
    if (isDuplicateContactResponse(response.status, payload)) {
      throw new AlgaPsaError(error.message, error.status, "duplicate_contact");
    }
    throw error;
  }

  const data = unwrapData(payload);
  const created = data ? contactFromRow(data, contact) : null;
  if (!created) {
    throw new AlgaPsaError("Alga PSA contact create returned no contact id.", 502);
  }
  return created;
}

/**
 * Resolve the portal client user to a PSA contact, creating one when absent.
 * A contact missing either a full name or an email is never created
 * incompletely: the function returns null and the caller decides whether the
 * ticket may proceed unattributed.
 */
export async function ensureContact(
  config: AlgaPsaIntakeConfig,
  contact: AlgaPortalContactInput,
  fetchImpl: typeof fetch = fetch,
): Promise<AlgaContact | null> {
  const fullName = contact.fullName?.trim() ?? "";
  const email = contact.email?.trim() ?? "";
  if (!fullName || !email) return null;

  const input: AlgaPortalContactInput = {
    fullName,
    email,
    phone: contact.phone ?? null,
    title: contact.title ?? null,
  };

  const existing = await findContact(config, email, fetchImpl);
  if (existing) return existing;

  try {
    return await createContact(config, input, fetchImpl);
  } catch (error) {
    // A create race or a stale duplicate constraint is resolved by looking the
    // winner up. Any other failure propagates so no unattributed ticket is made.
    if (
      error instanceof AlgaPsaError &&
      (error.status === 409 || error.code === "duplicate_contact")
    ) {
      const winner = await findContact(config, email, fetchImpl);
      if (winner) return winner;
      throw new AlgaPsaError(
        "Alga PSA reported a duplicate contact but no matching contact was found.",
        409,
        "contact_duplicate_unresolved",
      );
    }
    throw error;
  }
}

async function postIntakeTicket(
  input: CreateIntakeTicketInput,
  externalId: string,
  contactNameId: string | null,
  fetchImpl: typeof fetch,
): Promise<AlgaIntakeTicket> {
  const response = await requestWithTimeout(
    `${input.config.baseUrl}/tickets`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-api-key": input.config.apiKey,
      },
      body: JSON.stringify(buildTicketBody(input, externalId, contactNameId)),
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
 * Create one intake ticket in Alga PSA. No retry is attempted here: a retry of
 * a non-idempotent create can duplicate a ticket. The caller owns the
 * user-facing error path and must not fall back to a second system of record.
 */
export async function createIntakeTicket(
  input: CreateIntakeTicketInput,
  fetchImpl: typeof fetch = fetch,
): Promise<AlgaIntakeTicket> {
  return postIntakeTicket(input, normalizeExternalId(input.externalId), null, fetchImpl);
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
  if (response.status === 404) {
    await response.text().catch(() => "");
    return null;
  }

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

  const link = (data as { link?: { realm?: unknown } } | null)?.link;
  const realm = stringOrNull(link?.realm);
  if (input.portalOrganizationId && realm && realm !== input.portalOrganizationId) {
    throw new AlgaPsaError(
      "Alga PSA ticket lookup found the external id under a different portal organization.",
      409,
      "external_id_realm_mismatch",
    );
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
 *
 * The portal contact is resolved only after the lookup proves a new ticket is
 * needed, so a repeated submission never creates a stray contact. A contact
 * sync failure aborts the create instead of producing an unattributed ticket.
 */
export async function ensureIntakeTicket(
  input: CreateIntakeTicketInput,
  fetchImpl: typeof fetch = fetch,
): Promise<AlgaIntakeTicket> {
  const externalId = normalizeExternalId(input.externalId);
  const existing = await findIntakeTicket(
    {
      config: input.config,
      externalId,
      portalOrganizationId: input.portalOrganizationId,
    },
    fetchImpl,
  );
  if (existing) return existing;

  let contactNameId: string | null = null;
  if (input.portalContact) {
    const contact = await ensureContact(input.config, input.portalContact, fetchImpl);
    if (!contact) {
      throw new AlgaPsaError(
        "Alga PSA contact sync requires a full name and an email.",
        400,
        "contact_incomplete",
      );
    }
    contactNameId = contact.id;
  }

  try {
    return await postIntakeTicket(input, externalId, contactNameId, fetchImpl);
  } catch (error) {
    if (
      error instanceof AlgaPsaError &&
      error.status === 409 &&
      error.code === "duplicate_external_link"
    ) {
      const winner = await findIntakeTicket(
        {
          config: input.config,
          externalId,
          portalOrganizationId: input.portalOrganizationId,
        },
        fetchImpl,
      );
      if (winner) return winner;
    }
    throw error;
  }
}
