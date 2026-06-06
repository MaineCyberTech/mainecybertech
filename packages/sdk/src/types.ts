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
  status: string;
  sort_order: number;
  due_at: string | null;
  approval_required: boolean;
  owner_id: string | null;
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
