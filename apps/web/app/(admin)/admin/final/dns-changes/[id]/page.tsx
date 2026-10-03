import ModuleDetailPage, { type WorkflowAction } from "@/components/admin/ModuleDetailPage";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Record Detail (${id.slice(0, 8)}) - Admin - Maine CyberTech` };
}

const workflowActions: WorkflowAction[] = [
  {
    label: "Approve",
    endpoint: (id, api) => api.final.dnsChanges.approve(id),
    confirm: "Approve this DNS change request?",
  },
  {
    label: "Reject",
    endpoint: (id, api) => api.final.dnsChanges.reject(id),
    confirm: "Reject this DNS change request?",
  },
  {
    label: "Implement",
    endpoint: (id, api) => api.final.dnsChanges.implement(id),
    confirm: "Mark this DNS change as implemented?",
  },
];

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <ModuleDetailPage
      moduleKey="fn-dns"
      id={id}
      subnavKey="final"
      workflowActions={workflowActions}
    />
  );
}
