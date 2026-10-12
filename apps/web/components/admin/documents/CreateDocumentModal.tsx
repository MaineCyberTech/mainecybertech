import { useRef, type FormEvent, type RefObject } from "react";
import { Button } from "@mct/ui/components/Button";
import { Input, Textarea } from "@mct/ui/components/Input";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { VISIBILITY_OPTIONS, type OrganizationRecord } from "./types";

export default function CreateDocumentModal({
  open,
  organizations,
  busyId,
  formRef,
  fileRef,
  droppedFileName,
  onFileSelectionChange,
  onSubmit,
  onClose,
}: {
  open: boolean;
  organizations: OrganizationRecord[];
  busyId: string | null;
  formRef: RefObject<HTMLFormElement | null>;
  fileRef: RefObject<HTMLInputElement | null>;
  droppedFileName: string;
  onFileSelectionChange: (files: FileList | null) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-document-title"
        ref={modalRef}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        className="max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,24,0.97),rgba(10,17,24,0.96))] shadow-[0_30px_100px_rgba(2,6,23,0.45)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2
              id="create-document-title"
              className="font-display text-xl uppercase tracking-[0.12em] text-slate-50"
            >
              Create Document
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Add a new document record or upload one or more files.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-5 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="cyber-label" htmlFor="doc-organization-2">
                Organization
              </label>
              <select
                id="doc-organization-2"
                name="organizationId"
                className="cyber-input"
                defaultValue=""
                required
              >
                <option value="">Select organization</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name ?? organization.id}
                  </option>
                ))}
              </select>
            </div>
            <Input
              id="doc-name-2"
              name="name"
              label="Name"
              placeholder="Optional for multi-file mode"
            />
            <Input
              id="doc-storage-bucket"
              name="bucket"
              label="Storage Bucket"
              defaultValue="documents"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              id="doc-folder-path"
              name="category"
              label="Folder Path"
              placeholder="Optional folder/category"
            />
            <div>
              <label className="cyber-label" htmlFor="doc-visibility-2">
                Visibility
              </label>
              <select
                id="doc-visibility-2"
                name="visibility"
                className="cyber-input"
                defaultValue="private"
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <Input
              id="doc-existing-storage-path-optional"
              name="fileUrl"
              label="Existing Storage Path (optional)"
              placeholder="<org-id>/file.ext"
            />
          </div>
          <div>
            <label className="cyber-label" htmlFor="doc-upload-files">
              Upload File(s)
            </label>
            <div className="rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/5 p-5 text-center text-sm text-slate-300 transition hover:border-emerald-500/35 hover:bg-emerald-500/10">
              <p className="font-semibold text-emerald-300">Choose one or more files</p>
              <p className="mt-2 text-slate-400">
                This consolidated pass preserves the working upload flow and keeps the admin
                interactions aligned with 2.2.3.3.
              </p>
              <Input
                ref={fileRef}
                id="doc-upload-files"
                type="file"
                name="file"
                multiple
                className="mt-4"
                onChange={(e) => onFileSelectionChange(e.target.files)}
              />
              {droppedFileName ? (
                <p className="mt-3 text-emerald-300">Selected: {droppedFileName}</p>
              ) : null}
            </div>
          </div>
          <div>
            <Textarea id="doc-description-2" name="description" label="Description" rows={4} />
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={busyId === "create"}>
              {busyId === "create" ? "Creating..." : "Create Document"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
