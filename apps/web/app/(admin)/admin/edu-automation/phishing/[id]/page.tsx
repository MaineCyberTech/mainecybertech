import ModuleDetailPage, { type WorkflowAction } from "@/components/admin/ModuleDetailPage";
import { getClientApi } from "@/lib/client-api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Record Detail - Admin - Maine CyberTech" };

const workflowActions: WorkflowAction[] = [
  {
    label: "Launch",
    endpoint: (id, api: ReturnType<typeof getClientApi>) => api.eduAutomation.phishing.launch(id),
    confirm: "Launch this phishing campaign?",
  },
];

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <ModuleDetailPage
      moduleKey="edu-phishing"
      id={id}
      subnavKey="edu-automation"
      workflowActions={workflowActions}
    />
  );
}
