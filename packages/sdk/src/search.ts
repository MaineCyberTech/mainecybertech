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

export interface SearchResult {
  projects: Project[];
  tickets: Ticket[];
  users: User[];
  organizations: Organization[];
  documents: SearchDocument[];
}

export interface PortalSearchResult {
  projects: Project[];
  tickets: Ticket[];
  documents: SearchDocument[];
}

export class SearchApi {
  constructor(private client: ApiClient) {}

  admin(query: string) {
    return this.client.get<SearchResult>("/api/v1/search", { q: query });
  }

  portal(query: string, organizationId: string) {
    return this.client.get<PortalSearchResult>("/api/v1/search/portal", { q: query, organization_id: organizationId });
  }
}
