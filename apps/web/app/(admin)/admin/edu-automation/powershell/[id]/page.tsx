import ModuleDetailPage, { type WorkflowAction } from "@/components/admin/ModuleDetailPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Record Detail - Admin - Maine CyberTech" };

const workflowActions: WorkflowAction[] = [
  {
    label: "Run Policy Check",
    endpoint: (id, api) => api.eduAutomation.powershell.check(id),
    confirm: "Run the policy guard check on this script?",
  },
  {
    label: "Submit",
    endpoint: (id, api) => api.eduAutomation.powershell.submit(id),
    confirm: "Submit this script for review?",
  },
  {
    label: "Approve",
    endpoint: (id, api) => api.eduAutomation.powershell.approve(id),
    confirm: "Approve this script?",
  },
  {
    label: "Reject",
    endpoint: (id, api) => api.eduAutomation.powershell.reject(id),
    confirm: "Reject this script?",
  },
];

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <ModuleDetailPage
      moduleKey="edu-powershell"
      id={id}
      subnavKey="edu-automation"
      workflowActions={workflowActions}
    />
  );
}
