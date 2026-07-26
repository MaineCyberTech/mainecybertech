import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updatePatchGroup } from "@/lib/module-actions";

export const dynamic = "force-dynamic";

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    const items = (await api.securityOps.patchCompliance.list({})).items as unknown as Array<
      Record<string, unknown>
    >;
    record = items.find((r) => r.id === id) ?? null;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Patches", href: "/admin/patch-compliance" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="patch-compliance" />}
      title={String(record?.device_group ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "deviceGroup", label: "Group" },
          { key: "totalDevices", label: "Total", type: "number" },
          { key: "patchedDevices", label: "Patched", type: "number" },
          { key: "pendingPatches", label: "Pending", type: "number" },
          { key: "criticalPatches", label: "Critical", type: "number" },
          { key: "compliancePct", label: "Compliance %", type: "number" },
        ]}
        updateAction={updatePatchGroup}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/patch-compliance"
        parentLabel="Patches"
      />
    </AdminPageShell>
  );
}
