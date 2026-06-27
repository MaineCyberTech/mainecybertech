import { registerTask } from "../task-registry";
import { stripeReconcile } from "./stripe-reconcile";
import { jiraSync } from "./jira-sync";
import { jsmSync } from "./jsm-sync";
import { m365CalendarSync } from "./m365-calendar-sync";
import { scheduledNotifications } from "./scheduled-notifications";

export function registerAllTasks(): void {
  registerTask("stripe-reconcile", stripeReconcile);
  registerTask("jira-sync", jiraSync);
  registerTask("jsm-sync", jsmSync);
  registerTask("m365-calendar-sync", m365CalendarSync);
  registerTask("scheduled-notifications", scheduledNotifications);
}
