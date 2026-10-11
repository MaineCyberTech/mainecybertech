import { registerTask } from "../task-registry";
import { stripeReconcile } from "./stripe-reconcile";
import { jiraSync } from "./jira-sync";
import { jsmSync } from "./jsm-sync";
import { m365CalendarSync } from "./m365-calendar-sync";
import { scheduledNotifications } from "./scheduled-notifications";
import { notificationEmail } from "./notification-email";
import { retentionTask } from "./retention";
import { webhookDispatcher } from "./webhook-dispatcher";
import { webhookRetry } from "./webhook-retry";
import { orphanCleanup } from "./orphan-cleanup";
import { publicInteractionRetention } from "./public-interaction-retention";
import { apiKeyPrune } from "./api-key-prune";
import {
  domainMonitorCheck,
  websiteMonitorCheck,
  vendorContractRenewalCheck,
  patchComplianceCheck,
  licenseOptimizerCheck,
  backupDrCheck,
  qbrScheduledGenerate,
  phishingCampaignSend,
  m365HardeningScan,
  endpointSecurityCheck,
  saasAuditScan,
  statusMaintenanceCheck,
  dmarcCoachCheck,
  slaLogCheck,
  businessOsSnapshot,
  automationRunCheck,
  approvalOverdueCheck,
} from "./module-tasks";

export function registerAllTasks(): void {
  // MT-P2-006: per-tenant tasks declare the tenant-scope payload keys they
  // consume; the registry rejects any other scope-shaped key and validates the
  // declared values as UUIDs. Global report/purge tasks declare none.
  registerTask("stripe-reconcile", stripeReconcile, { tenantScopeKeys: ["organizationId"] });
  registerTask("jira-sync", jiraSync);
  registerTask("jsm-sync", jsmSync, { tenantScopeKeys: ["organizationId"] });
  registerTask("m365-calendar-sync", m365CalendarSync, { tenantScopeKeys: ["organizationId"] });
  registerTask("scheduled-notifications", scheduledNotifications);
  registerTask("notification-email", notificationEmail);
  registerTask("retention", retentionTask);
  registerTask("webhook-dispatcher", webhookDispatcher, { tenantScopeKeys: ["organizationId"] });
  registerTask("webhook-retry", webhookRetry);
  registerTask("orphan-cleanup", orphanCleanup);
  registerTask("public-interaction-retention", publicInteractionRetention);
  registerTask("api-key-prune", apiKeyPrune);

  registerTask("domain-monitor-check", domainMonitorCheck);
  registerTask("website-monitor-check", websiteMonitorCheck);
  registerTask("vendor-contract-renewal-check", vendorContractRenewalCheck);
  registerTask("patch-compliance-check", patchComplianceCheck);
  registerTask("license-optimizer-check", licenseOptimizerCheck);
  registerTask("backup-dr-check", backupDrCheck);
  registerTask("qbr-scheduled-generate", qbrScheduledGenerate);
  registerTask("phishing-campaign-send", phishingCampaignSend);
  registerTask("m365-hardening-scan", m365HardeningScan);
  registerTask("endpoint-security-check", endpointSecurityCheck);
  registerTask("saas-audit-scan", saasAuditScan);
  registerTask("status-maintenance-check", statusMaintenanceCheck);
  registerTask("dmarc-coach-check", dmarcCoachCheck);
  registerTask("sla-log-check", slaLogCheck);
  registerTask("business-os-snapshot", businessOsSnapshot);
  registerTask("automation-run-check", automationRunCheck);
  registerTask("approval-overdue-check", approvalOverdueCheck);
}
