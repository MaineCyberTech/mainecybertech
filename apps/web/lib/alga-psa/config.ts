import "server-only";

/**
 * Server-only configuration for the feature-flagged Alga PSA ticket intake.
 *
 * The flag is deliberately fail-closed: every value below must be present and
 * valid before a portal ticket is sent to the PSA. Any missing or malformed
 * value leaves the action on the existing Supabase path. Nothing in this
 * module ever logs or returns the API key.
 *
 * ADR 0001 makes Alga PSA the system of record for service delivery. The
 * portal remains an intake surface only; this first step therefore creates a
 * PSA ticket and does not dual-write it to Supabase.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const REQUIRED_KEYS = [
  "ALGA_PSA_BASE_URL",
  "ALGA_PSA_API_KEY",
  "ALGA_PSA_CLIENT_ID",
  "ALGA_PSA_BOARD_ID",
  "ALGA_PSA_STATUS_ID",
  "ALGA_PSA_PRIORITY_ID",
] as const;

const UUID_KEYS = [
  "ALGA_PSA_CLIENT_ID",
  "ALGA_PSA_BOARD_ID",
  "ALGA_PSA_STATUS_ID",
  "ALGA_PSA_PRIORITY_ID",
] as const;

/** Portal priorities are the only values the support form can submit. */
export const PORTAL_TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type PortalTicketPriority = (typeof PORTAL_TICKET_PRIORITIES)[number];

export interface AlgaPsaIntakeConfig {
  baseUrl: string;
  apiKey: string;
  clientId: string;
  boardId: string;
  statusId: string;
  /** Fallback PSA priority when no per-portal-priority mapping is configured. */
  priorityId: string;
  /**
   * Optional per-priority PSA UUIDs. When present, every portal priority maps
   * to its own PSA priority instead of collapsing to `priorityId`.
   */
  priorityMap?: Record<PortalTicketPriority, string> | null;
}

export type AlgaPsaConfigReason = "disabled" | "incomplete" | "invalid" | null;

export interface AlgaPsaConfigStatus {
  enabled: boolean;
  config: AlgaPsaIntakeConfig | null;
  /** Environment variable names that are absent or empty (never values). */
  missing: string[];
  /** Environment variable names whose values failed validation (never values). */
  invalid: string[];
  reason: AlgaPsaConfigReason;
}

function read(env: NodeJS.ProcessEnv, key: string): string {
  return String(env[key] ?? "").trim();
}

function normalizeBaseUrl(value: string): string | null {
  if (!value) return null;
  const normalized = value.replace(/\/+$/, "");
  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    // The client appends `/tickets`; require the documented API base so a
    // host-only value cannot silently post to the wrong path.
    if (!url.pathname.replace(/\/+$/, "").endsWith("/api/v1")) return null;
    return normalized;
  } catch {
    return null;
  }
}

function parseClientMap(raw: string): Record<string, string> | null {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const map: Record<string, string> = {};
    for (const [portalOrgId, clientId] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof clientId !== "string") return null;
      if (!UUID_PATTERN.test(portalOrgId) || !UUID_PATTERN.test(clientId.trim())) return null;
      map[portalOrgId] = clientId.trim();
    }
    return map;
  } catch {
    return null;
  }
}

/**
 * Parse the optional portal-priority -> PSA-priority map. All four portal
 * priorities must be present with valid UUIDs: a partial map would silently
 * collapse an unmapped priority to the fallback and lose the operator's
 * intent. An empty value means "not configured".
 */
function parsePriorityMap(raw: string): Record<PortalTicketPriority, string> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.length !== PORTAL_TICKET_PRIORITIES.length) return null;
    const map = {} as Record<PortalTicketPriority, string>;
    for (const [priority, value] of entries) {
      if (!(PORTAL_TICKET_PRIORITIES as readonly string[]).includes(priority)) return null;
      if (typeof value !== "string" || !UUID_PATTERN.test(value.trim())) return null;
      map[priority as PortalTicketPriority] = value.trim();
    }
    return map;
  } catch {
    return null;
  }
}

/**
 * Inspect the environment without throwing. `portalOrganizationId` is used to
 * resolve the optional `ALGA_PSA_CLIENT_MAP`; when the map is configured, an
 * unmapped portal organization is intentionally not routed to the PSA.
 */
export function readAlgaPsaIntakeConfig(
  env: NodeJS.ProcessEnv = process.env,
  portalOrganizationId?: string | null,
): AlgaPsaConfigStatus {
  const flag = read(env, "ALGA_PSA_INTAKE_ENABLED").toLowerCase() === "true";
  if (!flag) {
    return { enabled: false, config: null, missing: [], invalid: [], reason: "disabled" };
  }

  const missing = REQUIRED_KEYS.filter((key) => !read(env, key));
  const invalid: string[] = [];

  const baseUrl = normalizeBaseUrl(read(env, "ALGA_PSA_BASE_URL"));
  if (!baseUrl) invalid.push("ALGA_PSA_BASE_URL");

  for (const key of UUID_KEYS) {
    const value = read(env, key);
    if (value && !UUID_PATTERN.test(value)) invalid.push(key);
  }

  const rawMap = read(env, "ALGA_PSA_CLIENT_MAP");
  const clientMap = parseClientMap(rawMap);
  if (rawMap && !clientMap) invalid.push("ALGA_PSA_CLIENT_MAP");

  const rawPriorityMap = read(env, "ALGA_PSA_PRIORITY_MAP");
  const priorityMap = parsePriorityMap(rawPriorityMap);
  if (rawPriorityMap && !priorityMap) invalid.push("ALGA_PSA_PRIORITY_MAP");

  if (missing.length > 0 || invalid.length > 0) {
    return {
      enabled: false,
      config: null,
      missing,
      invalid,
      reason: missing.length > 0 ? "incomplete" : "invalid",
    };
  }

  let clientId = read(env, "ALGA_PSA_CLIENT_ID");
  if (clientMap && Object.keys(clientMap).length > 0) {
    const mapped = portalOrganizationId ? clientMap[portalOrganizationId] : undefined;
    if (!mapped) {
      // The map is an explicit allowlist. An unmapped tenant must never be
      // sent to another tenant's PSA client record.
      return { enabled: false, config: null, missing: [], invalid: [], reason: "disabled" };
    }
    clientId = mapped;
  }

  return {
    enabled: true,
    config: {
      baseUrl: baseUrl as string,
      apiKey: read(env, "ALGA_PSA_API_KEY"),
      clientId,
      boardId: read(env, "ALGA_PSA_BOARD_ID"),
      statusId: read(env, "ALGA_PSA_STATUS_ID"),
      priorityId: read(env, "ALGA_PSA_PRIORITY_ID"),
      priorityMap,
    },
    missing: [],
    invalid: [],
    reason: null,
  };
}

/**
 * Returns the resolved intake configuration, or null when intake should stay
 * on the existing Supabase path. Callers must pass the portal organization so
 * an optional `ALGA_PSA_CLIENT_MAP` allowlist can be applied.
 */
export function getAlgaPsaIntakeConfig(
  portalOrganizationId?: string | null,
  env: NodeJS.ProcessEnv = process.env,
): AlgaPsaIntakeConfig | null {
  return readAlgaPsaIntakeConfig(env, portalOrganizationId).config;
}

/**
 * Returns the full configuration status, including why intake is disabled.
 * Callers that must distinguish "flag off / tenant unmapped" from
 * "flag on but misconfigured" use this instead of `getAlgaPsaIntakeConfig`.
 */
export function getAlgaPsaIntakeStatus(
  portalOrganizationId?: string | null,
  env: NodeJS.ProcessEnv = process.env,
): AlgaPsaConfigStatus {
  return readAlgaPsaIntakeConfig(env, portalOrganizationId);
}

/** True only when the flag is on and every required value is valid. */
export function isAlgaPsaIntakeEnabled(
  portalOrganizationId?: string | null,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return readAlgaPsaIntakeConfig(env, portalOrganizationId).enabled;
}
