import { registerTask } from "../task-registry";
export async function runModuleTask(payload: Record<string, unknown>) { return { ok: true }; }
export function registerModuleTasks() { registerTask("module.refresh", runModuleTask); }
