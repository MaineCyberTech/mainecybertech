import type { MCTClient } from "@mct/sdk";
type ApiClient = MCTClient;

export type ModuleField = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "checkbox";
  options?: string[];
  required?: boolean;
};

export type ModuleConfig = {
  key: string;
  label: string;
  listPath: string;
  /** Resolver to the SDK sub-resource (must expose get/update/remove) */
  sdk: (api: ApiClient) => {
    get: (id: string) => Promise<unknown>;
    update: (id: string, data: Record<string, unknown>) => Promise<unknown>;
    remove: (id: string) => Promise<unknown>;
  };
  fields: ModuleField[];
};

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  // ---- governance ----
  "gov-changes": {
    key: "gov-changes",
    label: "Change Requests",
    listPath: "/admin/governance/change-requests",
    sdk: (api) => api.governance.changes,
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "changeType", label: "Change Type" },
      { key: "riskLevel", label: "Risk Level", type: "select", options: ["low", "medium", "high"] },
      { key: "rollbackPlan", label: "Rollback Plan", type: "textarea" },
      { key: "verificationSteps", label: "Verification Steps", type: "textarea" },
      { key: "implementationDate", label: "Implementation Date", type: "date" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          "draft",
          "submitted",
          "approved",
          "rejected",
          "implemented",
          "verified",
          "cancelled",
        ],
      },
    ],
  },
  "gov-risks": {
    key: "gov-risks",
    label: "Risk Register",
    listPath: "/admin/governance/risks",
    sdk: (api) => api.governance.risks,
    fields: [
      { key: "riskDescription", label: "Risk Description", type: "textarea" },
      { key: "riskCategory", label: "Category" },
      { key: "riskScore", label: "Risk Score", type: "number" },
      {
        key: "likelihood",
        label: "Likelihood",
        type: "select",
        options: ["low", "medium", "high"],
      },
      { key: "impact", label: "Impact", type: "select", options: ["low", "medium", "high"] },
      { key: "mitigatingControls", label: "Mitigating Controls", type: "textarea" },
      { key: "compensatingControls", label: "Compensating Controls", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["open", "monitored", "mitigated", "accepted", "closed"],
      },
    ],
  },
  "gov-retention": {
    key: "gov-retention",
    label: "Retention Policies",
    listPath: "/admin/governance/retention",
    sdk: (api) => api.governance.retention,
    fields: [
      { key: "dataCategory", label: "Data Category" },
      { key: "systemName", label: "System" },
      { key: "retentionPeriodDays", label: "Retention (days)", type: "number" },
      { key: "disposalMethod", label: "Disposal Method" },
      { key: "isRegulated", label: "Regulated", type: "checkbox" },
      { key: "regulationReference", label: "Regulation Reference" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["active", "inactive", "pending_review"],
      },
    ],
  },
  "gov-tabletop": {
    key: "gov-tabletop",
    label: "Tabletop Exercises",
    listPath: "/admin/governance/tabletop",
    sdk: (api) => api.governance.tabletop,
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "scenario", label: "Scenario", type: "textarea" },
      { key: "scenarioType", label: "Type" },
      { key: "participants", label: "Participants", type: "text" },
      { key: "scheduledDate", label: "Scheduled", type: "date" },
      { key: "actionItems", label: "Action Items", type: "textarea" },
      { key: "afterActionReport", label: "After Action Report", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["scheduled", "in_progress", "completed", "cancelled"],
      },
    ],
  },

  // ---- field-services ----
  "fs-isp": {
    key: "fs-isp",
    label: "ISP Assessments",
    listPath: "/admin/field-services/isp",
    sdk: (api) => api.fieldServices.isp,
    fields: [
      { key: "clientName", label: "Client" },
      { key: "currentProvider", label: "Current Provider" },
      { key: "currentCost", label: "Current Cost", type: "number" },
      {
        key: "contractStatus",
        label: "Contract",
        type: "select",
        options: ["locked", "renewal_due", "expiring", "negotiating"],
      },
      { key: "bandwidthCurrent", label: "Bandwidth (current)" },
      { key: "bandwidthNeeded", label: "Bandwidth (needed)" },
      { key: "notes", label: "Notes", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["draft", "in_progress", "completed"],
      },
    ],
  },
  "fs-unifi": {
    key: "fs-unifi",
    label: "UniFi Surveys",
    listPath: "/admin/field-services/unifi",
    sdk: (api) => api.fieldServices.unifi,
    fields: [
      { key: "siteName", label: "Site" },
      { key: "siteAddress", label: "Address" },
      { key: "accessPoints", label: "APs", type: "number" },
      { key: "switches", label: "Switches", type: "number" },
      { key: "cameras", label: "Cameras", type: "number" },
      { key: "surveyDate", label: "Survey Date", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["draft", "completed", "cancelled"],
      },
    ],
  },
  "fs-portmaps": {
    key: "fs-portmaps",
    label: "Port Maps",
    listPath: "/admin/field-services/port-maps",
    sdk: (api) => api.fieldServices.portMaps,
    fields: [
      { key: "switchName", label: "Switch" },
      { key: "portNumber", label: "Port", type: "number" },
      { key: "vlanName", label: "VLAN Name" },
      { key: "wallJackLabel", label: "Wall Jack" },
      { key: "connectedDevice", label: "Connected Device" },
      { key: "deviceType", label: "Device Type" },
      { key: "speed", label: "Speed" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  "fs-camera": {
    key: "fs-camera",
    label: "Camera Calculations",
    listPath: "/admin/field-services/camera-calc",
    sdk: (api) => api.fieldServices.camera,
    fields: [
      { key: "siteName", label: "Site" },
      { key: "cameraCount", label: "Cameras", type: "number" },
      { key: "resolution", label: "Resolution" },
      { key: "avgBitrateMbps", label: "Bitrate (Mbps)", type: "number" },
      { key: "retentionDays", label: "Retention (days)", type: "number" },
      { key: "estimatedStorageTb", label: "Storage (TB)", type: "number" },
      { key: "recommendedNvr", label: "Recommended NVR" },
      { key: "notes", label: "Notes", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: ["draft", "completed"] },
    ],
  },
  "fs-staging": {
    key: "fs-staging",
    label: "Hardware Staging",
    listPath: "/admin/field-services/staging",
    sdk: (api) => api.fieldServices.staging,
    fields: [
      { key: "deviceName", label: "Device" },
      { key: "deviceType", label: "Type" },
      { key: "serialNumber", label: "Serial" },
      { key: "assetTag", label: "Asset Tag" },
      { key: "configured", label: "Configured", type: "checkbox" },
      { key: "tested", label: "Tested", type: "checkbox" },
      { key: "qaVerified", label: "QA Verified", type: "checkbox" },
      { key: "notes", label: "Notes", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["pending", "staged", "ready", "deployed", "returned"],
      },
    ],
  },
  "fs-diagrams": {
    key: "fs-diagrams",
    label: "Network Diagrams",
    listPath: "/admin/field-services/network-diagrams",
    sdk: (api) => api.networkDiagrams,
    fields: [
      { key: "name", label: "Name" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },

  // ---- final ----
  "fn-backups": {
    key: "fn-backups",
    label: "Backup Status",
    listPath: "/admin/final/backups",
    sdk: (api) => api.final.backups,
    fields: [
      { key: "systemName", label: "System" },
      {
        key: "backupType",
        label: "Type",
        type: "select",
        options: ["full", "incremental", "differential"],
      },
      {
        key: "lastBackupStatus",
        label: "Last Status",
        type: "select",
        options: ["success", "failed", "warning", "running"],
      },
      { key: "retentionDays", label: "Retention (days)", type: "number" },
      { key: "offsiteReplicated", label: "Offsite Replicated", type: "checkbox" },
      { key: "encryptionEnabled", label: "Encrypted", type: "checkbox" },
      { key: "notes", label: "Notes", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["monitored", "attention", "paused"],
      },
    ],
  },
  "fn-budgets": {
    key: "fn-budgets",
    label: "Budget Roadmaps",
    listPath: "/admin/final/budgets",
    sdk: (api) => api.final.budgets,
    fields: [
      { key: "itemName", label: "Item" },
      { key: "category", label: "Category" },
      { key: "estimatedCost", label: "Estimated Cost", type: "number" },
      { key: "fiscalYear", label: "Fiscal Year", type: "number" },
      { key: "quarter", label: "Quarter", type: "number" },
      { key: "priority", label: "Priority", type: "select", options: ["low", "medium", "high"] },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["planned", "approved", "in_progress", "completed", "cancelled"],
      },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  "fn-device-profiles": {
    key: "fn-device-profiles",
    label: "Device Profiles",
    listPath: "/admin/final/device-profiles",
    sdk: (api) => api.deviceProfiles,
    fields: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "manufacturer", label: "Manufacturer" },
      { key: "model", label: "Model" },
      { key: "specs", label: "Specs", type: "textarea" },
    ],
  },
  "fn-dns": {
    key: "fn-dns",
    label: "DNS Change Requests",
    listPath: "/admin/final/dns-changes",
    sdk: (api) => api.final.dnsChanges,
    fields: [
      { key: "domain", label: "Domain" },
      {
        key: "changeType",
        label: "Type",
        type: "select",
        options: ["a", "cname", "mx", "txt", "srv", "ns"],
      },
      { key: "changeDescription", label: "Description", type: "textarea" },
      { key: "proposedValue", label: "Proposed Value" },
      { key: "currentValue", label: "Current Value" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["pending", "approved", "rejected", "implemented", "rolled_back"],
      },
    ],
  },
  "fn-forms": {
    key: "fn-forms",
    label: "Custom Forms",
    listPath: "/admin/final/forms",
    sdk: (api) => api.final.forms,
    fields: [
      { key: "formName", label: "Form Name" },
      { key: "formDescription", label: "Description", type: "textarea" },
      { key: "isActive", label: "Active", type: "checkbox" },
      { key: "submissionCount", label: "Submissions", type: "number" },
    ],
  },
  "fn-procurement": {
    key: "fn-procurement",
    label: "Procurement Quotes",
    listPath: "/admin/final/procurement",
    sdk: (api) => api.final.procurement,
    fields: [
      { key: "vendorName", label: "Vendor" },
      { key: "product", label: "Product" },
      { key: "quoteAmount", label: "Quote", type: "number" },
      { key: "competitorQuote", label: "Competitor Quote", type: "number" },
      { key: "selected", label: "Selected", type: "checkbox" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  "fn-runbooks": {
    key: "fn-runbooks",
    label: "Client Runbooks",
    listPath: "/admin/final/runbooks",
    sdk: (api) => api.final.runbooks,
    fields: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "version", label: "Version" },
      { key: "content", label: "Content", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["draft", "published", "archived"],
      },
    ],
  },
  "fn-saas": {
    key: "fn-saas",
    label: "SaaS Audits",
    listPath: "/admin/final/saas-audit",
    sdk: (api) => api.final.saasAudit,
    fields: [
      { key: "vendorName", label: "Vendor" },
      { key: "serviceName", label: "Service" },
      { key: "monthlyCost", label: "Monthly Cost", type: "number" },
      {
        key: "classification",
        label: "Classification",
        type: "select",
        options: ["critical", "core", "non_core", "legacy"],
      },
      { key: "usageFrequency", label: "Usage" },
      { key: "renewalDate", label: "Renewal", type: "date" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  "fn-satisfaction": {
    key: "fn-satisfaction",
    label: "Satisfaction Pulses",
    listPath: "/admin/final/satisfaction",
    sdk: (api) => api.final.satisfaction,
    fields: [
      { key: "subject", label: "Subject" },
      { key: "question", label: "Question" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["pending", "sent", "responded", "expired"],
      },
    ],
  },
  "fn-sharepoint": {
    key: "fn-sharepoint",
    label: "SharePoint Plans",
    listPath: "/admin/final/sharepoint",
    sdk: (api) => api.final.sharepoint,
    fields: [
      { key: "siteName", label: "Site Name" },
      { key: "teamName", label: "Team" },
      {
        key: "structureType",
        label: "Structure",
        type: "select",
        options: ["team_site", "communication_site", "hub_site"],
      },
      { key: "owner", label: "Owner" },
      { key: "sensitivityLabel", label: "Sensitivity" },
      {
        key: "externalSharing",
        label: "External Sharing",
        type: "select",
        options: ["disabled", "restricted", "enabled"],
      },
      { key: "notes", label: "Notes", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["planned", "in_progress", "completed"],
      },
    ],
  },
  "fn-time-entries": {
    key: "fn-time-entries",
    label: "Time Entries",
    listPath: "/admin/final/time-entries",
    sdk: (api) => api.final.timeEntries,
    fields: [
      { key: "description", label: "Description" },
      { key: "hours", label: "Hours", type: "number" },
      { key: "billable", label: "Billable", type: "checkbox" },
      { key: "workDate", label: "Work Date", type: "date" },
      { key: "ticketId", label: "Ticket ID" },
    ],
  },

  // ---- edu-automation ----
  "edu-sop": {
    key: "edu-sop",
    label: "SOP Library",
    listPath: "/admin/edu-automation/sop",
    sdk: (api) => api.eduAutomation.sop,
    fields: [
      { key: "title", label: "Title" },
      { key: "sopNumber", label: "SOP #" },
      { key: "category", label: "Category" },
      { key: "version", label: "Version" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["draft", "published", "archived"],
      },
    ],
  },
  "edu-compliance": {
    key: "edu-compliance",
    label: "Compliance Readiness",
    listPath: "/admin/edu-automation/compliance",
    sdk: (api) => api.eduAutomation.compliance,
    fields: [
      { key: "framework", label: "Framework" },
      { key: "controlId", label: "Control ID" },
      { key: "controlDescription", label: "Control Description", type: "textarea" },
      { key: "isCompliant", label: "Compliant", type: "checkbox" },
      { key: "evidenceCollected", label: "Evidence Collected", type: "checkbox" },
      { key: "notes", label: "Notes", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["not_started", "in_progress", "compliant", "non_compliant"],
      },
    ],
  },
  "edu-insurance": {
    key: "edu-insurance",
    label: "Insurance Evidence",
    listPath: "/admin/edu-automation/insurance",
    sdk: (api) => api.eduAutomation.insurance,
    fields: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      {
        key: "evidenceStatus",
        label: "Evidence Status",
        type: "select",
        options: ["needed", "requested", "collected", "verified", "expired"],
      },
      { key: "insuranceProvider", label: "Provider" },
      { key: "policyNumber", label: "Policy #" },
      { key: "expiryDate", label: "Expiry", type: "date" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["needed", "active", "expiring_soon", "expired"],
      },
    ],
  },
  "edu-ai-policy": {
    key: "edu-ai-policy",
    label: "AI Policies",
    listPath: "/admin/edu-automation/ai-policy",
    sdk: (api) => api.eduAutomation.aiPolicy,
    fields: [
      { key: "title", label: "Title" },
      { key: "content", label: "Content", type: "textarea" },
      { key: "dataHandlingRules", label: "Data Handling Rules", type: "textarea" },
      { key: "employeeGuidance", label: "Employee Guidance", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["draft", "published", "archived"],
      },
    ],
  },
  "edu-kb": {
    key: "edu-kb",
    label: "Knowledge Base",
    listPath: "/admin/edu-automation/kb",
    sdk: (api) => api.eduAutomation.kb,
    fields: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "content", label: "Content", type: "textarea" },
      { key: "isPublished", label: "Published", type: "checkbox" },
    ],
  },
  "edu-training": {
    key: "edu-training",
    label: "Training Modules",
    listPath: "/admin/edu-automation/training",
    sdk: (api) => api.eduAutomation.training,
    fields: [
      { key: "title", label: "Title" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "category", label: "Category" },
      { key: "durationMinutes", label: "Duration (min)", type: "number" },
      { key: "isRequired", label: "Required", type: "checkbox" },
      { key: "status", label: "Status", type: "select", options: ["draft", "active", "archived"] },
    ],
  },
  "edu-phishing": {
    key: "edu-phishing",
    label: "Phishing Campaigns",
    listPath: "/admin/edu-automation/phishing",
    sdk: (api) => api.eduAutomation.phishing,
    fields: [
      { key: "campaignName", label: "Campaign" },
      { key: "targetCount", label: "Targets", type: "number" },
      { key: "notes", label: "Notes", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["draft", "active", "in_progress", "completed", "cancelled"],
      },
    ],
  },
  "edu-scorecards": {
    key: "edu-scorecards",
    label: "Cyber Scorecards",
    listPath: "/admin/edu-automation/scorecards",
    sdk: (api) => api.eduAutomation.scorecards,
    fields: [
      { key: "category", label: "Category" },
      { key: "score", label: "Score", type: "number" },
      { key: "maxScore", label: "Max Score", type: "number" },
      { key: "badge", label: "Badge" },
    ],
  },
  "edu-automation-workflows": {
    key: "edu-automation-workflows",
    label: "Automation Workflows",
    listPath: "/admin/edu-automation/automation",
    sdk: (api) => api.eduAutomation.automation,
    fields: [
      { key: "name", label: "Name" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "scriptType", label: "Script Type" },
      { key: "triggerType", label: "Trigger" },
      { key: "isActive", label: "Active", type: "checkbox" },
    ],
  },
  "edu-powershell": {
    key: "edu-powershell",
    label: "PowerShell Scripts",
    listPath: "/admin/edu-automation/powershell",
    sdk: (api) => api.eduAutomation.powershell,
    fields: [
      { key: "name", label: "Name" },
      { key: "scriptContent", label: "Script", type: "textarea" },
      { key: "riskLevel", label: "Risk Level", type: "select", options: ["low", "medium", "high"] },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["draft", "pending_review", "approved", "rejected"],
      },
    ],
  },
  "edu-kb-generator": {
    key: "edu-kb-generator",
    label: "KB Generations",
    listPath: "/admin/edu-automation/kb-generator",
    sdk: (api) => api.eduAutomation.kbGenerator,
    fields: [
      { key: "sourceTitle", label: "Source Title" },
      { key: "generatedContent", label: "Generated Content", type: "textarea" },
      { key: "reviewedContent", label: "Reviewed Content", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["draft", "approved", "rejected"],
      },
    ],
  },

  // ---- standalone admin lists (previously read-only) ----
  "insurance-binder": {
    key: "insurance-binder",
    label: "Insurance Binder",
    listPath: "/admin/insurance-binder",
    sdk: (api) => api.insuranceBinder,
    fields: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      {
        key: "evidenceStatus",
        label: "Evidence Status",
        type: "select",
        options: ["needed", "requested", "collected", "verified", "expired"],
      },
      { key: "insuranceProvider", label: "Provider" },
      { key: "policyNumber", label: "Policy #" },
      { key: "expiryDate", label: "Expiry", type: "date" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["needed", "active", "expiring_soon", "expired"],
      },
    ],
  },
  "license-optimizer": {
    key: "license-optimizer",
    label: "License Optimizer",
    listPath: "/admin/license-optimizer",
    sdk: (api) => api.licenseOptimizer,
    fields: [
      { key: "softwareName", label: "Software" },
      { key: "licenseType", label: "Type" },
      { key: "totalSeats", label: "Total Seats", type: "number" },
      { key: "usedSeats", label: "Used Seats", type: "number" },
      { key: "costPerSeat", label: "Cost/Seat", type: "number" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["active", "inactive", "expiring"],
      },
    ],
  },
  "status-pages": {
    key: "status-pages",
    label: "Status Page Components",
    listPath: "/admin/status-pages",
    sdk: (api) => api.statusPage.components,
    fields: [
      { key: "name", label: "Name" },
      { key: "description", label: "Description" },
      { key: "componentType", label: "Type" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["operational", "degraded", "partial_outage", "major_outage", "maintenance"],
      },
      { key: "displayOrder", label: "Display Order", type: "number" },
    ],
  },
  "uptime-monitor": {
    key: "uptime-monitor",
    label: "Uptime Monitor",
    listPath: "/admin/uptime-monitor",
    sdk: (api) => ({
      get: (id) => api.uptimeMonitor.getCheck(id),
      update: (id, data) => api.uptimeMonitor.updateCheck(id, data),
      remove: (id) => api.uptimeMonitor.removeCheck(id),
    }),
    fields: [
      { key: "url", label: "URL" },
      {
        key: "checkType",
        label: "Check Type",
        type: "select",
        options: ["http", "https", "tcp", "ping"],
      },
      { key: "checkIntervalMinutes", label: "Interval (min)", type: "number" },
      { key: "expectedStatusCode", label: "Expected Status", type: "number" },
      { key: "timeoutSeconds", label: "Timeout (s)", type: "number" },
      { key: "status", label: "Status", type: "select", options: ["active", "paused"] },
    ],
  },
  "training-hub": {
    key: "training-hub",
    label: "Training Courses",
    listPath: "/admin/training-hub",
    sdk: (api) => api.trainingHub.courses,
    fields: [
      { key: "title", label: "Title" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "category", label: "Category" },
      {
        key: "difficulty",
        label: "Difficulty",
        type: "select",
        options: ["beginner", "intermediate", "advanced"],
      },
      { key: "estimatedMinutes", label: "Est. Minutes", type: "number" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["draft", "published", "archived"],
      },
    ],
  },
};

export function getModuleConfig(moduleKey: string): ModuleConfig | undefined {
  return MODULE_CONFIGS[moduleKey];
}
