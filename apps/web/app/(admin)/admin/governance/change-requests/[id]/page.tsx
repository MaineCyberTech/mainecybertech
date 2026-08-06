import ModuleDetailPage, { type WorkflowAction } from "@/components/admin/ModuleDetailPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Record Detail - Admin - Maine CyberTech" };

const workflowActions: WorkflowAction[] = [
  {
    label: "Submit",
    endpoint: (id, api) => api.governance.changes.submit(id),
    confirm: "Submit this change request for review?",
  },
  {
    label: "Approve",
    endpoint: (id, api) => api.governance.changes.approve(id),
    confirm: "Approve this change request?",
  },
  {
    label: "Reject",
    endpoint: (id, api) => api.governance.changes.reject(id),
    confirm: "Reject this change request?",
  },
  {
    label: "Implement",
    endpoint: (id, api) => api.governance.changes.implement(id),
    confirm: "Mark this change as implemented?",
  },
  {
    label: "Verify",
    endpoint: (id, api) => api.governance.changes.verify(id),
    confirm: "Mark this change as verified?",
  },
];

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <ModuleDetailPage
      moduleKey="gov-changes"
      id={id}
      subnavKey="governance"
      workflowActions={workflowActions}
    />
  );
}
