import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { requireAdminAccess } from "@/lib/auth/admin";
import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import DocumentPreview from "@/components/DocumentPreview";
import DocumentVersionsClient from "@/components/portal/DocumentVersionsClient";
import DocumentShareClient from "@/components/portal/DocumentShareClient";

export const metadata = {
  title: "Document Details - Portal - Maine CyberTech",
};

function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "\u2014";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

type PortalDocumentPageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export default async function PortalDocumentDetailPage({
  params,
}: PortalDocumentPageProps) {
  const { documentId } = await params;
  const api = getApiClient();
  const membership = await getApprovedMembership();

  if (!membership?.organization_id) {
    throw new Error("No approved membership found.");
  }

  let document: any;
  try {
    document = await api.documents.get(documentId);
  } catch {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        Document not found.
      </div>
    );
  }

  let downloadUrl: string | null = null;
  try {
    const result = await api.documents.createSignedUrl(documentId);
    downloadUrl = result.signedUrl;
  } catch {
    downloadUrl = null;
  }
  const bucketName = document.storage_bucket ?? "documents";
  const displayTitle = document.title ?? document.name ?? "Untitled Document";

  let isAdmin = false;
  try {
    await requireAdminAccess();
    isAdmin = true;
  } catch {
    isAdmin = false;
  }

  let initialShares: any[] = [];
  try {
    initialShares = await api.documents.listShares(documentId);
  } catch {
    initialShares = [];
  }

  return (
    <div className="space-y-6">
      <PortalBreadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Documents", href: "/portal/documents" },
          { label: displayTitle },
        ]}
      />

      <PortalSubnav current="documents" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">
            {displayTitle}
          </h1>
          <p className="mt-3 text-slate-400">{document.file_name}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="cyber-pill">{formatBytes(document.file_size)}</span>
          <span className="cyber-pill">
            {document.mime_type ?? "Unknown type"}
          </span>
          {isAdmin ? (
            <Link href="/admin/documents" className="cyber-button-secondary">
              View in Admin
            </Link>
          ) : null}
          <Link href="/portal/documents" className="cyber-button-secondary">
            Back to Documents
          </Link>
        </div>
      </div>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Document Summary</h2>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {document.description ?? "No description provided."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="cyber-pill">Created: {document.created_at}</div>
            <div className="cyber-pill">
              Updated: {document.updated_at ?? document.created_at}
            </div>
            <div className="cyber-pill">Visibility: {document.visibility}</div>
            <div className="cyber-pill">Bucket: {bucketName}</div>
          </div>
        </div>
      </section>

      {downloadUrl ? (
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Preview</h2>
          <div className="mt-6">
            <DocumentPreview
              url={downloadUrl}
              mimeType={document.mime_type}
              fileName={document.file_name}
            />
          </div>
        </section>
      ) : null}

      <DocumentShareClient
        documentId={documentId}
        initialShares={initialShares}
      />

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Download & Version Info</h2>
        <DocumentVersionsClient documentId={documentId} />

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="cyber-pill">
              Version {document.current_version ?? 1}
            </div>
            <div className="cyber-pill">Created: {document.created_at}</div>
            <div className="cyber-pill">
              Updated: {document.updated_at ?? document.created_at}
            </div>
            <div className="cyber-pill">Visibility: {document.visibility}</div>
          </div>

          {downloadUrl ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="cyber-button inline-flex items-center"
            >
              Download Document
            </a>
          ) : (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-amber-300">
              A download link could not be generated right now.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
