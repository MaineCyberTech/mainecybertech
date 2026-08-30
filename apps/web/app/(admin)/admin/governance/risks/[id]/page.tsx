import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { getModuleConfig } from "@/lib/module-config";
import { updateModuleRecord, deleteModuleRecord } from "@/lib/module-record-actions";
import RiskAssessButton from "./RiskAssessButton";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Risk Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const config = getModuleConfig("gov-risks");
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
      subnav={<AdminSubnav current="governance" />}
      title={String(record?.risk_description ?? config.label)}
    >
      {record && <RiskAssessButton id={id} />}
      <div className="mt-4">
        <RecordDetail
          id={id}
          record={record}
          fields={config.fields}
          updateAction={updateModuleRecord.bind(null, "gov-risks")}
          onUpdate={async () => {
            "use server";
          }}
          deleteAction={deleteModuleRecord.bind(null, "gov-risks")}
          parentHref={config.listPath}
          parentLabel={config.label}
        />
      </div>
    </AdminPageShell>
  );
}
