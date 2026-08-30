import ModuleDetailPage, { type WorkflowAction } from "@/components/admin/ModuleDetailPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Record Detail - Admin - Maine CyberTech" };

const workflowActions: WorkflowAction[] = [
  {
    label: "Generate Draft",
    endpoint: (id, api) => api.eduAutomation.kbGenerator.generate(id),
    confirm: "Generate an article draft from this request?",
  },
];

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <ModuleDetailPage
      moduleKey="edu-kb-generator"
      id={id}
      subnavKey="edu-automation"
      workflowActions={workflowActions}
    />
  );
}
