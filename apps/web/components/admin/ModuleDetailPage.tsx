import { getApiClient } from "@/lib/api";
import { getClientApi } from "@/lib/client-api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import WorkflowActionButtons from "@/components/admin/WorkflowActionButtons";
import { getModuleConfig } from "@/lib/module-config";
import { updateModuleRecord, deleteModuleRecord } from "@/lib/module-record-actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export type WorkflowAction = {
  label: string;
  endpoint: (id: string, api: ReturnType<typeof getClientApi>) => Promise<unknown>;
  confirm?: string;
};

export default async function ModuleDetailPage({
  moduleKey,
  id,
  subnavKey,
  workflowActions = [],
}: {
  moduleKey: string;
  id: string;
  subnavKey: string;
  workflowActions?: WorkflowAction[];
}) {
  await requireAdminAccess();
  const config = getModuleConfig(moduleKey);
  if (!config) redirect("/admin");

  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await config.sdk(api).get(id)) as unknown as Record<string, unknown>;
  } catch {
    record = null;
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: config.label, href: config.listPath },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current={subnavKey} />}
      title={String(record?.title ?? record?.name ?? record?.site_name ?? config.label)}
    >
      {workflowActions.length > 0 && record && (
        <WorkflowActionButtons id={id} actions={workflowActions} />
      )}
      <RecordDetail
        id={id}
        record={record}
        fields={config.fields}
        updateAction={updateModuleRecord.bind(null, moduleKey)}
        onUpdate={async () => {
          "use server";
        }}
        deleteAction={deleteModuleRecord.bind(null, moduleKey)}
        parentHref={config.listPath}
        parentLabel={config.label}
      />
    </AdminPageShell>
  );
}
