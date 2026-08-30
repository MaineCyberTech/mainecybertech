import { getSupabaseAdmin } from "./supabase";
import { logAuditEvent } from "./audit";
import { AppError, success } from "../types";

export interface OnboardingRecord {
  id: string;
  organization_id: string;
  client_name: string;
  client_domain: string | null;
  client_contact_email: string | null;
  client_contact_phone: string | null;
  onboarding_lead_id: string | null;
  status: string;
  phase: string;
  risk_level: string;
  discovery_notes: string | null;
  m365_setup_status: string;
  m365_tenant_id: string | null;
  m365_licenses: Record<string, unknown>;
  access_collection_status: string;
  access_credentials: Record<string, unknown>;
  network_baseline_status: string;
  network_diagram_url: string | null;
  network_scan_results: Record<string, unknown>;
  documentation_status: string;
  documentation_url: string | null;
  security_baseline_status: string;
  security_baseline_score: number | null;
  security_findings: unknown[];
  support_handoff_status: string;
  support_handoff_notes: string | null;
  handoff_completed_at: string | null;
  next_review_at: string | null;
  started_at: string;
  completed_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  organization_id: string;
  onboarding_record_id: string;
  phase: string;
  item_key: string;
  label: string;
  description: string | null;
  is_required: boolean;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CHECKLIST_ITEMS: Omit<
  ChecklistItem,
  "id" | "organization_id" | "onboarding_record_id" | "created_at" | "updated_at"
>[] = [
  // Discovery Phase
  {
    phase: "discovery",
    item_key: "initial_meeting",
    label: "Initial Kickoff Meeting",
    description: "Schedule and conduct initial discovery meeting with client stakeholders",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 1,
  },
  {
    phase: "discovery",
    item_key: "stakeholder_map",
    label: "Stakeholder Mapping",
    description: "Identify and document key client contacts and decision makers",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 2,
  },
  {
    phase: "discovery",
    item_key: "environment_survey",
    label: "Environment Survey",
    description: "Document current IT environment, systems, and infrastructure",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 3,
  },
  {
    phase: "discovery",
    item_key: "pain_points",
    label: "Pain Points & Goals",
    description: "Capture client pain points, priorities, and success criteria",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 4,
  },
  {
    phase: "discovery",
    item_key: "scope_agreement",
    label: "Scope Agreement",
    description: "Finalize and sign onboarding scope of work",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 5,
  },

  // M365 Setup Phase
  {
    phase: "m365_setup",
    item_key: "tenant_provisioning",
    label: "Tenant Provisioning",
    description: "Provision or validate M365 tenant and verify domain ownership",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 1,
  },
  {
    phase: "m365_setup",
    item_key: "license_assignment",
    label: "License Assignment",
    description: "Assign appropriate licenses based on user roles and requirements",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 2,
  },
  {
    phase: "m365_setup",
    item_key: "security_defaults",
    label: "Security Defaults / Conditional Access",
    description: "Enable security defaults or configure conditional access policies",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 3,
  },
  {
    phase: "m365_setup",
    item_key: "mfa_enrollment",
    label: "MFA Enrollment",
    description: "Enforce MFA for all users and verify enrollment",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 4,
  },
  {
    phase: "m365_setup",
    item_key: "exchange_setup",
    label: "Exchange Online Setup",
    description: "Configure mail flow, domains, and email security policies",
    is_required: false,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 5,
  },
  {
    phase: "m365_setup",
    item_key: "teams_setup",
    label: "Teams Configuration",
    description: "Configure Teams policies, guest access, and meeting settings",
    is_required: false,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 6,
  },
  {
    phase: "m365_setup",
    item_key: "sharepoint_setup",
    label: "SharePoint/OneDrive Setup",
    description: "Configure sharing policies, retention, and site structure",
    is_required: false,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 7,
  },

  // Access Collection Phase
  {
    phase: "access_collection",
    item_key: "credential_inventory",
    label: "Credential Inventory",
    description: "Collect and document all system credentials in secure vault",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 1,
  },
  {
    phase: "access_collection",
    item_key: "vpn_access",
    label: "VPN/Remote Access",
    description: "Configure and test VPN or remote access for MSP team",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 2,
  },
  {
    phase: "access_collection",
    item_key: "admin_accounts",
    label: "Admin Account Access",
    description: "Obtain and verify administrative access to key systems",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 3,
  },
  {
    phase: "access_collection",
    item_key: "vendor_portals",
    label: "Vendor Portal Access",
    description: "Document access to vendor portals (ISP, hardware, software)",
    is_required: false,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 4,
  },
  {
    phase: "access_collection",
    item_key: "documentation_access",
    label: "Documentation Repository Access",
    description: "Ensure access to client documentation, diagrams, and runbooks",
    is_required: false,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 5,
  },

  // Network Baseline Phase
  {
    phase: "network_baseline",
    item_key: "network_diagram",
    label: "Network Diagram Creation",
    description: "Create or update network topology diagram",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 1,
  },
  {
    phase: "network_baseline",
    item_key: "ip_scheme_doc",
    label: "IP Scheme Documentation",
    description: "Document IP addressing scheme, VLANs, and subnets",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 2,
  },
  {
    phase: "network_baseline",
    item_key: "firewall_rules",
    label: "Firewall Rule Review",
    description: "Review and document firewall rules and policies",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 3,
  },
  {
    phase: "network_baseline",
    item_key: "wifi_audit",
    label: "Wireless Audit",
    description: "Document SSIDs, authentication methods, and coverage",
    is_required: false,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 4,
  },
  {
    phase: "network_baseline",
    item_key: "vulnerability_scan",
    label: "Vulnerability Scan",
    description: "Run and document initial vulnerability assessment",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 5,
  },

  // Documentation Phase
  {
    phase: "documentation",
    item_key: "runbook_creation",
    label: "Runbook Creation",
    description: "Create operational runbooks for common tasks and incidents",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 1,
  },
  {
    phase: "documentation",
    item_key: "asset_inventory",
    label: "Asset Inventory",
    description: "Complete hardware and software asset inventory",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 2,
  },
  {
    phase: "documentation",
    item_key: "contact_sheet",
    label: "Emergency Contact Sheet",
    description: "Create and distribute emergency contact documentation",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 3,
  },
  {
    phase: "documentation",
    item_key: "sla_document",
    label: "SLA Documentation",
    description: "Document agreed SLAs, response times, and escalation paths",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 4,
  },
  {
    phase: "documentation",
    item_key: "backup_verification",
    label: "Backup Verification",
    description: "Verify backup configurations and test restores",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 5,
  },

  // Security Baseline Phase
  {
    phase: "security_baseline",
    item_key: "endpoint_protection",
    label: "Endpoint Protection",
    description: "Deploy and verify endpoint protection on all managed devices",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 1,
  },
  {
    phase: "security_baseline",
    item_key: "patch_baseline",
    label: "Patch Management Baseline",
    description: "Establish patch management schedule and baseline compliance",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 2,
  },
  {
    phase: "security_baseline",
    item_key: "email_security",
    label: "Email Security Configuration",
    description: "Configure anti-phishing, anti-spam, and DMARC/DKIM/SPF",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 3,
  },
  {
    phase: "security_baseline",
    item_key: "security_awareness",
    label: "Security Awareness Training",
    description: "Schedule or deploy initial security awareness training",
    is_required: false,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 4,
  },
  {
    phase: "security_baseline",
    item_key: "incident_response",
    label: "Incident Response Plan",
    description: "Document and review incident response procedures",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 5,
  },

  // Support Handoff Phase
  {
    phase: "support_handoff",
    item_key: "ticketing_integration",
    label: "Ticketing Integration",
    description: "Configure ticketing system integration and routing rules",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 1,
  },
  {
    phase: "support_handoff",
    item_key: "monitoring_setup",
    label: "Monitoring & Alerting",
    description: "Deploy monitoring agents and configure alert thresholds",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 2,
  },
  {
    phase: "support_handoff",
    item_key: "knowledge_transfer",
    label: "Knowledge Transfer Session",
    description: "Conduct formal knowledge transfer with support team",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 3,
  },
  {
    phase: "support_handoff",
    item_key: "go_live_confirmation",
    label: "Go-Live Confirmation",
    description: "Obtain sign-off and confirm go-live readiness",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 4,
  },
  {
    phase: "support_handoff",
    item_key: "first_week_review",
    label: "First Week Review",
    description: "Schedule and conduct first week post-go-live review",
    is_required: true,
    is_completed: false,
    completed_by: null,
    completed_at: null,
    notes: null,
    sort_order: 5,
  },
];

export async function listOnboardingRecords(
  organizationId: string,
  options: {
    status?: string;
    phase?: string;
    riskLevel?: string;
    onboardingLeadId?: string;
    page: number;
    limit: number;
  },
) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("client_onboarding_command_center_records")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (options.status) query = query.eq("status", options.status);
  if (options.phase) query = query.eq("phase", options.phase);
  if (options.riskLevel) query = query.eq("risk_level", options.riskLevel);
  if (options.onboardingLeadId) query = query.eq("onboarding_lead_id", options.onboardingLeadId);

  const from = (options.page - 1) * options.limit;
  const to = from + options.limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new AppError("DB_ERROR", error.message, 500);

  return success({
    items: data ?? [],
    total: count ?? 0,
    page: options.page,
    limit: options.limit,
  });
}

export async function getOnboardingRecord(organizationId: string, id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("client_onboarding_command_center_records")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (error) throw new AppError("NOT_FOUND", "Onboarding record not found", 404);
  return success(data);
}

export async function createOnboardingRecord(
  organizationId: string,
  userId: string,
  input: {
    clientName: string;
    clientDomain?: string | null;
    clientContactEmail?: string | null;
    clientContactPhone?: string | null;
    onboardingLeadId?: string | null;
    status?: string;
    phase?: string;
    riskLevel?: string;
    discoveryNotes?: string | null;
    m365SetupStatus?: string;
    m365TenantId?: string | null;
    m365Licenses?: Record<string, unknown>;
    accessCollectionStatus?: string;
    accessCredentials?: Record<string, unknown>;
    networkBaselineStatus?: string;
    networkDiagramUrl?: string | null;
    networkScanResults?: Record<string, unknown>;
    documentationStatus?: string;
    documentationUrl?: string | null;
    securityBaselineStatus?: string;
    securityBaselineScore?: number | null;
    securityFindings?: unknown[];
    supportHandoffStatus?: string;
    supportHandoffNotes?: string | null;
    nextReviewAt?: string | null;
  },
) {
  const supabase = getSupabaseAdmin();

  const { data: record, error } = await supabase
    .from("client_onboarding_command_center_records")
    .insert({
      organization_id: organizationId,
      client_name: input.clientName,
      client_domain: input.clientDomain,
      client_contact_email: input.clientContactEmail,
      client_contact_phone: input.clientContactPhone,
      onboarding_lead_id: input.onboardingLeadId,
      status: input.status ?? "discovery",
      phase: input.phase ?? "discovery",
      risk_level: input.riskLevel ?? "medium",
      discovery_notes: input.discoveryNotes,
      m365_setup_status: input.m365SetupStatus ?? "not_started",
      m365_tenant_id: input.m365TenantId,
      m365_licenses: input.m365Licenses ?? {},
      access_collection_status: input.accessCollectionStatus ?? "not_started",
      access_credentials: input.accessCredentials ?? {},
      network_baseline_status: input.networkBaselineStatus ?? "not_started",
      network_diagram_url: input.networkDiagramUrl,
      network_scan_results: input.networkScanResults ?? {},
      documentation_status: input.documentationStatus ?? "not_started",
      documentation_url: input.documentationUrl,
      security_baseline_status: input.securityBaselineStatus ?? "not_started",
      security_baseline_score: input.securityBaselineScore,
      security_findings: input.securityFindings ?? [],
      support_handoff_status: input.supportHandoffStatus ?? "not_started",
      support_handoff_notes: input.supportHandoffNotes,
      next_review_at: input.nextReviewAt,
    })
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  // Create default checklist items
  const checklistInserts = DEFAULT_CHECKLIST_ITEMS.map((item) => ({
    organization_id: organizationId,
    onboarding_record_id: record.id,
    ...item,
  }));

  const { error: checklistError } = await supabase
    .from("client_onboarding_checklist_items")
    .insert(checklistInserts);

  if (checklistError) {
    // Log but don't fail the creation
    console.error("Failed to create checklist items:", checklistError);
  }

  // Audit log
  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "client_onboarding.create",
    entityType: "client_onboarding",
    entityId: record.id,
    metadata: { clientName: input.clientName, status: input.status ?? "discovery" },
  });

  return success(record);
}

export async function updateOnboardingRecord(
  organizationId: string,
  userId: string,
  id: string,
  input: Partial<OnboardingRecord>,
) {
  const supabase = getSupabaseAdmin();

  // Get current record for audit
  const { data: current, error: currentError } = await supabase
    .from("client_onboarding_command_center_records")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (currentError) throw new AppError("NOT_FOUND", "Onboarding record not found", 404);

  const updateData: Record<string, unknown> = { ...input, version: current.version + 1 };
  delete updateData.id;
  delete updateData.organization_id;
  delete updateData.created_at;

  const { data, error } = await supabase
    .from("client_onboarding_command_center_records")
    .update(updateData)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  // Audit log
  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "client_onboarding.update",
    entityType: "client_onboarding",
    entityId: id,
    metadata: { before: current, after: data },
  });

  return success(data);
}

export async function deleteOnboardingRecord(organizationId: string, userId: string, id: string) {
  const supabase = getSupabaseAdmin();

  const { data: current, error: currentError } = await supabase
    .from("client_onboarding_command_center_records")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (currentError) throw new AppError("NOT_FOUND", "Onboarding record not found", 404);

  const { error } = await supabase
    .from("client_onboarding_command_center_records")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", id);

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "client_onboarding.delete",
    entityType: "client_onboarding",
    entityId: id,
    metadata: { clientName: current.client_name },
  });

  return success({ deleted: true });
}

export async function completePhase(
  organizationId: string,
  userId: string,
  id: string,
  phase: string,
  completedBy: string,
  notes?: string | null,
) {
  const supabase = getSupabaseAdmin();

  const phaseOrder = [
    "discovery",
    "m365_setup",
    "access_collection",
    "network_baseline",
    "documentation",
    "security_baseline",
    "support_handoff",
    "completed",
  ];
  const currentIndex = phaseOrder.indexOf(phase);
  const nextPhase =
    currentIndex >= 0 && currentIndex < phaseOrder.length - 1
      ? phaseOrder[currentIndex + 1]
      : "completed";

  // Get current record for version
  const { data: currentRecord, error: currentError } = await supabase
    .from("client_onboarding_command_center_records")
    .select("version")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (currentError) throw new AppError("NOT_FOUND", "Onboarding record not found", 404);

  const { data: record, error } = await supabase
    .from("client_onboarding_command_center_records")
    .update({
      phase: nextPhase,
      status: nextPhase === "completed" ? "completed" : phase,
      completed_at: nextPhase === "completed" ? new Date().toISOString() : null,
      version: (currentRecord?.version ?? 0) + 1,
    })
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  // Update checklist items for this phase
  await supabase
    .from("client_onboarding_checklist_items")
    .update({
      is_completed: true,
      completed_by: completedBy,
      completed_at: new Date().toISOString(),
      notes,
    })
    .eq("organization_id", organizationId)
    .eq("onboarding_record_id", id)
    .eq("phase", phase)
    .eq("is_completed", false);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "client_onboarding.complete_phase",
    entityType: "client_onboarding",
    entityId: id,
    metadata: { phase, nextPhase, notes },
  });

  return success(record);
}

export async function getChecklistItems(organizationId: string, onboardingRecordId: string) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("client_onboarding_checklist_items")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("onboarding_record_id", onboardingRecordId)
    .order("phase")
    .order("sort_order");

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  return success(data ?? []);
}

export async function updateChecklistItem(
  organizationId: string,
  userId: string,
  itemId: string,
  input: { isCompleted?: boolean; completedBy?: string | null; notes?: string | null },
) {
  const supabase = getSupabaseAdmin();

  const { data: current, error: currentError } = await supabase
    .from("client_onboarding_checklist_items")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", itemId)
    .single();

  if (currentError) throw new AppError("NOT_FOUND", "Checklist item not found", 404);

  const updateData: Record<string, unknown> = { ...input };
  if (input.isCompleted && !current.is_completed) {
    updateData.completed_at = new Date().toISOString();
    updateData.completed_by = input.completedBy;
  } else if (!input.isCompleted && current.is_completed) {
    updateData.completed_at = null;
    updateData.completed_by = null;
  }

  const { data, error } = await supabase
    .from("client_onboarding_checklist_items")
    .update(updateData)
    .eq("organization_id", organizationId)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw new AppError("DB_ERROR", error.message, 500);

  await logAuditEvent({
    organizationId,
    actorUserId: userId,
    action: "client_onboarding.checklist_update",
    entityType: "client_onboarding_checklist",
    entityId: itemId,
    metadata: { before: current, after: data },
  });

  return success(data);
}

export async function exportOnboardingRecords(
  organizationId: string,
  options: {
    status?: string;
    phase?: string;
    riskLevel?: string;
    format: "csv" | "json";
  },
) {
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("client_onboarding_command_center_records")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (options.status) query = query.eq("status", options.status);
  if (options.phase) query = query.eq("phase", options.phase);
  if (options.riskLevel) query = query.eq("risk_level", options.riskLevel);

  const { data, error } = await query.limit(10000);
  if (error) throw new AppError("DB_ERROR", error.message, 500);

  return success(data ?? []);
}
