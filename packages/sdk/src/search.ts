import { ApiClient } from "./client";
import type { Project, Ticket, User, Organization } from "./types";

/**
 * Document rows returned by the search endpoints. The API projects only these
 * columns (not the full `Document` record), and admin search additionally
 * filters by the `can_read_document` visibility model.
 */
export interface SearchDocument {
  id: string;
  name: string;
  organization_id: string;
  mime_type?: string | null;
  visibility?: string | null;
}

/**
 * Per-entity totals returned by admin search (SEARCH-P2-004).
 *
 * The documents count is the readable subset of the fetched window — or the
 * exact DB total for super admins — so hidden private/internal documents
 * cannot be inferred (SEARCH-P2-008).
 */
export interface SearchCounts {
  users: number;
  organizations: number;
  tickets: number;
  projects: number;
  documents: number;
}

export interface SearchResult {
  projects: Project[];
  tickets: Ticket[];
  users: User[];
  organizations: Organization[];
  documents: SearchDocument[];
  counts: SearchCounts;
  /** Applied page size (default 5, hard cap 25). */
  limit: number;
}

/** Portal search has a fixed page size of 5 per entity and no counts. */
export interface PortalSearchResult {
  projects: Project[];
  tickets: Ticket[];
  documents: SearchDocument[];
}

export interface AdminSearchOptions {
  /** Page size for every entity (1-25; the API clamps out-of-range values). */
  limit?: number;
}

export class SearchApi {
  constructor(private client: ApiClient) {}

  admin(query: string, options: AdminSearchOptions = {}) {
    const params: Record<string, string | number> = { q: query };
    if (options.limit !== undefined) params.limit = options.limit;
    return this.client.get<SearchResult>("/api/v1/search", params);
  }

  portal(query: string, organizationId: string) {
    return this.client.get<PortalSearchResult>("/api/v1/search/portal", { q: query, organization_id: organizationId });
  }
}
