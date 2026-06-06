import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import PortalDocumentsCenterClient from "@/components/portal/PortalDocumentsCenterClient";
import { uploadPortalDocument } from "./actions";
import { bulkFolderAction, bulkMetadataAction } from "./bulk-actions";

export const metadata = { title: "Documents - Portal - Maine CyberTech" };

export default async function PortalDocumentsPage() {
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) {
    return (
      <div className="space-y-6">
        <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Documents" }]} />
        <PortalSubnav current="documents" />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">
          Access restricted. Please contact your administrator.
        </div>
      </div>
    );
  }

  const result = await api.documents.list({
    organizationId: membership.organization_id,
  });
  const documents = result.items ?? [];

  return (
    <div className="space-y-6">
      <PortalBreadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Documents" }]} />
      <PortalSubnav current="documents" />

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Documents</h1>
          <p className="mt-3 text-slate-400">View and upload documents shared with your organization.</p>
        </div>
      </div>

      <PortalDocumentsCenterClient
        documents={documents}
        organizationId={membership.organization_id}
        uploadAction={uploadPortalDocument}
        bulkFolderAction={bulkFolderAction}
        bulkMetadataAction={bulkMetadataAction}
      />
    </div>
  );
}
