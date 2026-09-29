import ModuleDetailPage, { type WorkflowAction } from "@/components/admin/ModuleDetailPage";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Record Detail (${id.slice(0, 8)}) - Admin - Maine CyberTech` };
}

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
