import ModuleDetailPage, { type WorkflowAction } from "@/components/admin/ModuleDetailPage";
import PhishingTargetsPanel from "./PhishingTargetsPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Record Detail - Admin - Maine CyberTech" };

const workflowActions: WorkflowAction[] = [
  {
    label: "Launch",
    endpoint: (id, api) => api.eduAutomation.phishing.launch(id),
    confirm: "Launch this phishing campaign?",
  },
];

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <div className="space-y-4">
      <PhishingTargetsPanel campaignId={id} />
      <ModuleDetailPage
        moduleKey="edu-phishing"
        id={id}
        subnavKey="edu-automation"
        workflowActions={workflowActions}
      />
    </div>
  );
}
