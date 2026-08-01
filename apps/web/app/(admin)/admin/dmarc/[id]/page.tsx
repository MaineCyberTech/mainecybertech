import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateDmarc } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "DMARC Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    const items = (await api.batch.dmarc.list({})).items as unknown as Array<
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
            { label: "DMARC", href: "/admin/dmarc" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="dmarc" />}
      title={String(record?.domain ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "domain", label: "Domain" },
          { key: "spfValid", label: "SPF Valid", type: "checkbox" },
          { key: "dkimConfigured", label: "DKIM", type: "checkbox" },
          { key: "dmarcValid", label: "DMARC Valid", type: "checkbox" },
          { key: "dmarcPolicy", label: "Policy" },
          { key: "recommendationNotes", label: "Recommendations", type: "textarea" },
        ]}
        updateAction={updateDmarc}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/dmarc"
        parentLabel="DMARC"
      />
    </AdminPageShell>
  );
}
