import ModuleDetailPage, { type WorkflowAction } from "@/components/admin/ModuleDetailPage";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Record Detail (${id.slice(0, 8)}) - Admin - Maine CyberTech` };
}

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
