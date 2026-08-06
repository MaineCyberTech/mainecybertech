import ModuleDetailPage, { type WorkflowAction } from "@/components/admin/ModuleDetailPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Record Detail - Admin - Maine CyberTech" };

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
