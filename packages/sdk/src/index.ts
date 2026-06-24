import {
  ApiClient,
  type ClientOptions,
  type RetryOptions,
  ApiError,
} from "./client";
import { AuthApi, type SignInResult, type SignUpResult } from "./auth";
import { OrganizationsApi } from "./organizations";
import { MembershipsApi } from "./memberships";
import { TicketsApi } from "./tickets";
import { ProjectsApi } from "./projects";
import { DocumentsApi } from "./documents";
import { DashboardApi } from "./dashboard";
import {
  UsersApi,
  type UserPermissionsResponse,
  type PermissionOverride,
} from "./users";
import { ProfilesApi } from "./profiles";
import { AuditApi } from "./audit";
import { RolesApi, type RolePermissions } from "./roles";
import {
  NotificationsApi,
  type NotificationPreference,
  type NotificationPreferencesResponse,
} from "./notifications";
import {
  BillingApi,
  type Invoice,
  type Subscription,
  type Payment,
  type BillingCustomer,
  type BillingSummary,
} from "./billing";
import {
  WebhooksApi,
  type WebhookEndpoint,
  type WebhookDelivery,
} from "./webhooks";
import { BulkApi, type BulkInviteResult } from "./bulk";
import { ApiKeysApi, type ApiKey, type ApiKeyWithSecret } from "./api-keys";
import { SLApi, type SLAMetrics } from "./sla";
import {
  SearchApi,
  type SearchResult,
  type PortalSearchResult,
} from "./search";

export { ApiError } from "./client";
export type { ClientOptions, RetryOptions } from "./client";
export type * from "./types";
export type {
  SignInResult,
  SignUpResult,
  UserPermissionsResponse,
  PermissionOverride,
  RolePermissions,
  NotificationPreference,
  NotificationPreferencesResponse,
  Invoice,
  Subscription,
  Payment,
  BillingCustomer,
  BillingSummary,
  WebhookEndpoint,
  WebhookDelivery,
  BulkInviteResult,
  SearchResult,
  PortalSearchResult,
};

export class MCTClient {
  public auth: AuthApi;
  public organizations: OrganizationsApi;
  public memberships: MembershipsApi;
  public tickets: TicketsApi;
  public projects: ProjectsApi;
  public documents: DocumentsApi;
  public dashboard: DashboardApi;
  public users: UsersApi;
  public profiles: ProfilesApi;
  public audit: AuditApi;
  public roles: RolesApi;
  public notifications: NotificationsApi;
  public billing: BillingApi;
  public webhooks: WebhooksApi;
  public bulk: BulkApi;
  public apiKeys: ApiKeysApi;
  public sla: SLApi;
  public search: SearchApi;

  constructor(private client: ApiClient) {
    this.auth = new AuthApi(client);
    this.organizations = new OrganizationsApi(client);
    this.memberships = new MembershipsApi(client);
    this.tickets = new TicketsApi(client);
    this.projects = new ProjectsApi(client);
    this.documents = new DocumentsApi(client);
    this.dashboard = new DashboardApi(client);
    this.users = new UsersApi(client);
    this.profiles = new ProfilesApi(client);
    this.audit = new AuditApi(client);
    this.roles = new RolesApi(client);
    this.notifications = new NotificationsApi(client);
    this.billing = new BillingApi(client);
    this.webhooks = new WebhooksApi(client);
    this.bulk = new BulkApi(client);
    this.apiKeys = new ApiKeysApi(client);
    this.sla = new SLApi(client);
    this.search = new SearchApi(client);
  }

  static create(opts: ClientOptions) {
    const client = new ApiClient(opts);
    return new MCTClient(client);
  }
}
