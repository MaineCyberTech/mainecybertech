import { ApiClient } from "./client";
import type { Project, Ticket, User, Organization } from "./types";

export interface SearchResult {
  projects: Project[];
  tickets: Ticket[];
  users: User[];
  organizations: Organization[];
}

export interface PortalSearchResult {
  projects: Project[];
  tickets: Ticket[];
  documents: Array<{ id: string; name: string; organization_id: string; mime_type?: string | null }>;
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
