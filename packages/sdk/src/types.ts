export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthUser {
  userId: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  title?: string | null;
  avatarUrl?: string | null;
  isSuperAdmin?: boolean;
  defaultOrganizationId?: string | null;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  primary_domain: string | null;
  support_plan: string | null;
  logo_url?: string | null;
  brand_color?: string | null;
  accent_color?: string | null;
  custom_domain?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationDomain {
  id: string;
  organization_id: string;
  domain: string;
  auto_approve: boolean;
  created_at: string;
}

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  status: string;
  is_billing_contact: boolean;
  is_security_contact: boolean;
  created_at: string;
  roles?: { key: string; name?: string } | null;
  organizations?: Organization | null;
}

export interface OrganizationOnboardInput {
  name: string;
  slug: string;
  primaryDomain?: string | null;
  supportPlan?: string | null;
  adminEmail: string;
  adminFullName?: string | null;
  adminRoleKey?: string;
}

export interface OrganizationOnboardResult {
  organization: Organization;
  adminUser: { id: string; email: string };
  membership: Membership;
  invited: boolean;
  /**
   * ADMIN-P2-004: the first-admin membership starts `pending`; a platform
   * super admin must approve it before the admin can act for the tenant.
   */
  approvalRequired?: boolean;
}

export interface Ticket {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  source: string;
  external_jsm_issue_key?: string | null;
  labels?: string[] | null;
  resolution?: string | null;
  jira_last_synced_at?: string | null;
  /**
   * Optimistic-locking row version (USE-P3-004). Pass it back as `ifMatch`
   * on `tickets.update`; the API rejects a stale write with 409.
   */
  version?: number;
  created_at: string;
  updated_at: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  organization_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  starts_at: string | null;
  due_at: string | null;
  external_jira_project_key?: string | null;
  jira_last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  details: string | null;
  status: string;
  sort_order: number;
  due_at: string | null;
  approval_required: boolean;
  owner_id: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  external_jira_issue_key?: string | null;
  issue_type?: string | null;
  priority?: string | null;
  labels?: string[] | null;
  parent_task_id?: string | null;
  epic_key?: string | null;
  resolution?: string | null;
  sprint?: string | null;
  jira_last_synced_at?: string | null;
  created_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  is_pinned: boolean;
  created_at: string;
}

export interface ProjectTaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface ProjectTaskReadState {
  task_id: string;
  user_id?: string | null;
  last_seen_at: string;
}

export interface Document {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  visibility: string;
  folder_path: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  mime_type: string | null;
  file_name: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  current_version: number | null;
  /**
   * Optimistic-locking row version (USE-P3-004). Pass it back as `ifMatch`
   * on `documents.update`; the API rejects a stale write with 409.
   */
  version?: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  title: string | null;
  is_super_admin: boolean;
  default_organization_id: string | null;
  created_at: string;
}

export interface DashboardSummary {
  managedServices: number;
  openTickets: number;
  activeProjects: number;
  totalDocuments: number;
  pendingMemberships: number;
}

export interface Role {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  is_system?: boolean;
}

export interface AuditLog {
  id: string;
  organization_id: string | null;
  actor_user_id: string | null;
  actor_type: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ProjectDetail {
  project: Project & { project_tasks: ProjectTask[] };
  memberships: Membership[];
  profiles: Profile[];
  roles: Role[];
  tasks: ProjectTask[];
  comments: ProjectTaskComment[];
  readStates: ProjectTaskReadState[];
}

export interface OrganizationDetail {
  organization: Organization;
  domains: OrganizationDomain[];
  memberships: Membership[];
  profiles: Profile[];
  roles: Role[];
}

export interface UserDetail {
  user: User;
  profile: Profile | null;
  memberships: Membership[];
  organizations: Organization[];
  roles: Role[];
  allRoles: Role[];
}

export interface UserCompound {
  user: User;
  profile: Profile | null;
  memberships: Membership[];
  organizations: Organization[];
  roles: Role[];
  allRoles: Role[];
}

export interface Notification {
  id: string;
  user_id: string;
  organization_id?: string | null;
  title: string;
  body: string;
  module: string;
  module_id?: string | null;
  action: string;
  read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  storage_path: string;
  uploaded_by: string;
  checksum?: string | null;
  created_at: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  organization_id: string;
  created_by: string;
  token: string;
  expires_at: string;
  access_count: number;
  max_access: number | null;
  revoked_at: string | null;
  created_at: string;
  share_url?: string;
}

export interface DocumentAccessResponse {
  documentName: string;
  mimeType: string | null;
  downloadUrl: string;
  expiresIn: number;
}

/**
 * Per-row outcome returned by the API's bulk update endpoints
 * (`POST /documents/bulk/*`, `POST /tickets/bulk`). The API returns
 * `{ results, successful, failed, skipped? }`; callers must render the
 * per-item outcome instead of assuming the requested count succeeded
 * (USE-P2-001).
 */
export interface BulkUpdateResultRow {
  id: string;
  success: boolean;
  error?: string;
  version?: number;
}

export interface BulkUpdateResult {
  results: BulkUpdateResultRow[];
  successful: number;
  failed: number;
  /** Requested ids the caller may not touch (tickets bulk endpoint only). */
  skipped?: number;
}

/**
 * Dry-run preview returned by the bulk document endpoints when `dryRun: true`
 * (ADMIN-P2-003). `rows` lists only the documents the caller may touch, with
 * the current and proposed value of every field the apply would change.
 */
export interface BulkPreviewRow {
  id: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  changes: string[];
}

export interface BulkPreviewResult {
  dryRun: true;
  requested: number;
  matched: number;
  skipped: number;
  rows: BulkPreviewRow[];
}
