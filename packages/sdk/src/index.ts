import { ApiClient, type ClientOptions, type RetryOptions, ApiError } from "./client";
import type { OrganizationOnboardInput, OrganizationOnboardResult } from "./types";
import { AuthApi, type SignInResult, type SignUpResult } from "./auth";
import { OrganizationsApi } from "./organizations";
import { MembershipsApi } from "./memberships";
import { TicketsApi } from "./tickets";
import { ProjectsApi } from "./projects";
import { DocumentsApi } from "./documents";
import { DashboardApi } from "./dashboard";
import { UsersApi, type UserPermissionsResponse, type PermissionOverride } from "./users";
import { ProfilesApi } from "./profiles";
import { AuditApi } from "./audit";
import { RolesApi, type RolePermissions, type RoleWithPermissions } from "./roles";
import {
  PermissionsApi,
  type MyPermissionsResponse,
  type PermissionInfo,
  type MembershipBrief,
} from "./permissions";
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
import { WebhooksApi, type WebhookEndpoint, type WebhookDelivery } from "./webhooks";
import { BulkApi, type BulkInviteResult } from "./bulk";
import { ApiKeysApi, type ApiKey, type ApiKeyWithSecret } from "./api-keys";
import { SLApi, type SLAMetrics } from "./sla";
import {
  ApprovalsApi,
  type ApprovalRequest,
  type ApprovalStats,
  type ApprovalDetail,
} from "./approvals";
import {
  ProposalsApi,
  type Proposal,
  type ProposalPhase,
  type ProposalLineItem,
  type ProposalDetail,
} from "./proposals";
import { FindingsApi, type Finding, type FindingDetail, type FindingStats } from "./findings";
import { AssetsApi, type Asset, type AssetDetail, type AssetStats } from "./assets";
import {
  DomainMonitorsApi,
  type DomainMonitor,
  type DomainMonitorDetail,
  type DomainStats,
} from "./domain-monitors";
import { QbrApi, type QbrReport } from "./qbr";
import { FileRequestsApi, type FileRequest } from "./file-requests";
import { AiApi, type TriageAnalysis, type TicketSummary, type ReplyDraft } from "./ai";
import { VendorsApi, type VendorContract, type VendorContact } from "./vendors";
import { ServiceCatalogApi, type ServiceCatalogItem } from "./service-catalog";
import {
  BatchApi,
  type LicenseRecord,
  type StatusItem,
  type WebsiteMonitor,
  type DmarcAssessment,
} from "./batch";
import {
  SecurityOpsApi,
  type OffboardingRecord,
  type BreakGlassAccount,
  type OnboardingClient,
  type PatchGroup,
} from "./security-ops";
import {
  SecuritySuiteApi,
  type M365HardeningRecord,
  type IncidentRecord,
  type IdentityVerification,
  type EndpointSecurity,
} from "./security-suite";
import {
  GovernanceApi,
  type GovernanceChange,
  type GovernanceRisk,
  type GovernanceRetention,
  type GovernanceTabletop,
} from "./governance";
import { FieldServicesApi } from "./field-services";
import { EduAutomationApi } from "./edu-automation";
import { FinalApi } from "./final";
import { SearchApi, type SearchResult, type PortalSearchResult } from "./search";
import type {
  ClientOnboardingRecord,
  ChecklistItem,
  ListOnboardingQuery,
  CreateOnboardingInput,
  UpdateOnboardingInput,
  CompletePhaseInput,
  ExportOnboardingInput,
  ChecklistItemInput,
  UpdateChecklistItemInput,
} from "./client-onboarding-command-center";
import { ClientOnboardingApi } from "./client-onboarding-command-center.api";
import type {
  SatisfactionPulseRecord,
  Template,
  Schedule,
  ListSatisfactionPulseQuery,
  CreateSatisfactionPulseInput,
  UpdateSatisfactionPulseInput,
  RespondSatisfactionPulseInput,
  ExportSatisfactionPulseInput,
  TemplateInput,
  UpdateTemplateInput,
  ScheduleInput,
  UpdateScheduleInput,
} from "./satisfaction-pulse-widget";
import { SatisfactionPulseApi } from "./satisfaction-pulse-widget.api";

import type {
  DynamicFormRecord,
  DynamicFormField,
  FormSubmission,
  ListDynamicFormsQuery,
  CreateDynamicFormInput,
  UpdateDynamicFormInput,
  SubmitDynamicFormInput,
  ExportDynamicFormsInput,
} from "./dynamic-client-forms-builder";
import { DynamicFormsApi } from "./dynamic-client-forms-builder.api";
import { BusinessOsApi } from "./business-os.api";
import { LicenseOptimizerApi } from "./license-optimizer";
import { DmarcCoachApi } from "./dmarc-coach";
import { TrainingHubApi } from "./training-hub";
import { InsuranceBinderApi } from "./insurance-binder";
import { StatusPageApi } from "./status-page";
import { UptimeMonitorApi } from "./uptime-monitor";
import {
  StoreApi,
  type StorePromotion,
  type StorePromotionStatus,
  type CreateStorePromotionInput,
  type UpdateStorePromotionInput,
  type StoreProduct,
  type StoreCategory,
  type StoreCategoryDetail,
  type StoreQuote,
  type StoreQuoteItem,
  type SubmitStoreQuoteInput,
} from "./store";
import { KnowledgeBaseApi, type KnowledgeBaseArticle } from "./knowledge-base";

export { ApiError } from "./client";
export type { ClientOptions, RetryOptions } from "./client";
export type * from "./types";
export type {
  SignInResult,
  SignUpResult,
  UserPermissionsResponse,
  PermissionOverride,
  RolePermissions,
  RoleWithPermissions,
  MyPermissionsResponse,
  PermissionInfo,
  MembershipBrief,
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
  ApprovalRequest,
  ApprovalStats,
  ApprovalDetail,
  Proposal,
  ProposalPhase,
  ProposalLineItem,
  ProposalDetail,
  Finding,
  FindingDetail,
  FindingStats,
  Asset,
  AssetDetail,
  AssetStats,
  DomainMonitor,
  DomainMonitorDetail,
  DomainStats,
  QbrReport,
  FileRequest,
  TriageAnalysis,
  TicketSummary,
  ReplyDraft,
  VendorContract,
  VendorContact,
  ServiceCatalogItem,
  LicenseRecord,
  StatusItem,
  WebsiteMonitor,
  DmarcAssessment,
  OffboardingRecord,
  BreakGlassAccount,
  OnboardingClient,
  PatchGroup,
  M365HardeningRecord,
  IncidentRecord,
  IdentityVerification,
  EndpointSecurity,
  ClientOnboardingRecord,
  ChecklistItem,
  ListOnboardingQuery,
  CreateOnboardingInput,
  UpdateOnboardingInput,
  CompletePhaseInput,
  ExportOnboardingInput,
  ChecklistItemInput,
  UpdateChecklistItemInput,
  DynamicFormRecord,
  DynamicFormField,
  FormSubmission,
  ListDynamicFormsQuery,
  CreateDynamicFormInput,
  UpdateDynamicFormInput,
  SubmitDynamicFormInput,
  ExportDynamicFormsInput,
  StorePromotion,
  StorePromotionStatus,
  CreateStorePromotionInput,
  UpdateStorePromotionInput,
  StoreProduct,
  StoreCategory,
  StoreCategoryDetail,
  StoreQuote,
  StoreQuoteItem,
  SubmitStoreQuoteInput,
  KnowledgeBaseArticle,
  OrganizationOnboardInput,
  OrganizationOnboardResult,
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
  public permissions: PermissionsApi;
  public notifications: NotificationsApi;
  public billing: BillingApi;
  public webhooks: WebhooksApi;
  public bulk: BulkApi;
  public apiKeys: ApiKeysApi;
  public sla: SLApi;
  public search: SearchApi;
  public approvals: ApprovalsApi;
  public proposals: ProposalsApi;
  public findings: FindingsApi;
  public assets: AssetsApi;
  public domainMonitors: DomainMonitorsApi;
  public qbr: QbrApi;
  public fileRequests: FileRequestsApi;
  public ai: AiApi;
  public vendors: VendorsApi;
  public serviceCatalog: ServiceCatalogApi;
  public batch: BatchApi;
  public securityOps: SecurityOpsApi;
  public securitySuite: SecuritySuiteApi;
  public governance: GovernanceApi;
  public fieldServices: FieldServicesApi;
  public eduAutomation: EduAutomationApi;
  public final: FinalApi;
  public clientOnboarding: ClientOnboardingApi;
  public satisfactionPulse: SatisfactionPulseApi;
  public dynamicForms: DynamicFormsApi;
  public businessOs: BusinessOsApi;
  public licenseOptimizer: LicenseOptimizerApi;
  public dmarcCoach: DmarcCoachApi;
  public trainingHub: TrainingHubApi;
  public insuranceBinder: InsuranceBinderApi;
  public statusPage: StatusPageApi;
  public uptimeMonitor: UptimeMonitorApi;
  public store: StoreApi;
  public knowledgeBase: KnowledgeBaseApi;

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
    this.permissions = new PermissionsApi(client);
    this.notifications = new NotificationsApi(client);
    this.billing = new BillingApi(client);
    this.webhooks = new WebhooksApi(client);
    this.bulk = new BulkApi(client);
    this.apiKeys = new ApiKeysApi(client);
    this.sla = new SLApi(client);
    this.search = new SearchApi(client);
    this.approvals = new ApprovalsApi(client);
    this.proposals = new ProposalsApi(client);
    this.findings = new FindingsApi(client);
    this.assets = new AssetsApi(client);
    this.domainMonitors = new DomainMonitorsApi(client);
    this.qbr = new QbrApi(client);
    this.fileRequests = new FileRequestsApi(client);
    this.ai = new AiApi(client);
    this.vendors = new VendorsApi(client);
    this.serviceCatalog = new ServiceCatalogApi(client);
    this.batch = new BatchApi(client);
    this.securityOps = new SecurityOpsApi(client);
    this.securitySuite = new SecuritySuiteApi(client);
    this.governance = new GovernanceApi(client);
    this.fieldServices = new FieldServicesApi(client);
    this.eduAutomation = new EduAutomationApi(client);
    this.final = new FinalApi(client);
    this.clientOnboarding = new ClientOnboardingApi(client);
    this.satisfactionPulse = new SatisfactionPulseApi(client);
    this.dynamicForms = new DynamicFormsApi(client);
    this.businessOs = new BusinessOsApi(client);
    this.licenseOptimizer = new LicenseOptimizerApi(client);
    this.dmarcCoach = new DmarcCoachApi(client);
    this.trainingHub = new TrainingHubApi(client);
    this.insuranceBinder = new InsuranceBinderApi(client);
    this.statusPage = new StatusPageApi(client);
    this.uptimeMonitor = new UptimeMonitorApi(client);
    this.store = new StoreApi(client);
    this.knowledgeBase = new KnowledgeBaseApi(client);
  }

  static create(opts: ClientOptions) {
    const client = new ApiClient(opts);
    return new MCTClient(client);
  }
}

export type { Database } from "./database.types";
