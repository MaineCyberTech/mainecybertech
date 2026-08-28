import { ApiClient } from "./client";

export type ComplianceControlStatus =
  | "not_started"
  | "in_progress"
  | "implemented"
  | "not_applicable";

export interface ComplianceFramework {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ComplianceControl {
  id: string;
  framework_id: string;
  organization_id: string;
  title: string;
  status: ComplianceControlStatus;
  owner: string | null;
  due_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateFrameworkInput {
  organizationId: string;
  name: string;
  description?: string | null;
}

export interface CreateControlInput {
  organizationId: string;
  title: string;
  status?: ComplianceControlStatus;
  owner?: string | null;
  dueAt?: string | null;
  notes?: string | null;
}

export interface UpdateControlInput {
  title?: string;
  status?: ComplianceControlStatus;
  owner?: string | null;
  dueAt?: string | null;
  notes?: string | null;
}

export class ComplianceApi {
  constructor(private client: ApiClient) {}

  listFrameworks(organizationId: string) {
    return this.client.get<ComplianceFramework[]>(
      `/api/v1/compliance/frameworks`,
      { organization_id: organizationId },
    );
  }

  createFramework(data: CreateFrameworkInput) {
    return this.client.post<ComplianceFramework>(`/api/v1/compliance/frameworks`, data);
  }

  listControls(frameworkId: string, organizationId: string) {
    return this.client.get<ComplianceControl[]>(
      `/api/v1/compliance/frameworks/${frameworkId}/controls`,
      { organization_id: organizationId },
    );
  }

  createControl(frameworkId: string, data: CreateControlInput) {
    return this.client.post<ComplianceControl>(
      `/api/v1/compliance/frameworks/${frameworkId}/controls`,
      data,
    );
  }

  updateControl(id: string, organizationId: string, data: UpdateControlInput) {
    return this.client.patch<ComplianceControl>(
      `/api/v1/compliance/controls/${id}`,
      data,
      { organization_id: organizationId },
    );
  }

  removeControl(id: string, organizationId: string) {
    return this.client.delete<void>(`/api/v1/compliance/controls/${id}`, {
      organization_id: organizationId,
    });
  }
}
