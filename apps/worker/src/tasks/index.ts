import { registerTask } from "../task-registry";
import { stripeReconcile } from "./stripe-reconcile";
import { jiraSync } from "./jira-sync";
import { jsmSync } from "./jsm-sync";
import { m365CalendarSync } from "./m365-calendar-sync";
import { scheduledNotifications } from "./scheduled-notifications";
import { retentionTask } from "./retention";
import { webhookDispatcher } from "./webhook-dispatcher";
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
} from "./module-tasks";

export function registerAllTasks(): void {
  registerTask("stripe-reconcile", stripeReconcile);
  registerTask("jira-sync", jiraSync);
  registerTask("jsm-sync", jsmSync);
  registerTask("m365-calendar-sync", m365CalendarSync);
  registerTask("scheduled-notifications", scheduledNotifications);
  registerTask("retention", retentionTask);
  registerTask("webhook-dispatcher", webhookDispatcher);

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
}
