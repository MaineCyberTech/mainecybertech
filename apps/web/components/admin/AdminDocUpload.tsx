"use client";

import { useState, useRef } from "react";
import { uploadOrgDocument } from "@/app/(admin)/admin/organizations/[orgId]/actions";

type Props = { organizationId: string };

export default function AdminDocUpload({ organizationId }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    setResult(null);
    const fd = new FormData();
    fd.append("organizationId", organizationId);
    fd.append("title", title);
    fd.append("description", description);
    fd.append("file", file);
    const res = await uploadOrgDocument(fd);
    setResult(res);
    setUploading(false);
    if (res.ok) {
      setTitle("");
      setDescription("");
      setFile(null);
      formRef.current?.reset();
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="cyber-label">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="cyber-input mt-1"
          placeholder="Document title"
          required
        />
      </div>
      <div>
        <label className="cyber-label">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="cyber-input mt-1"
          rows={2}
          placeholder="Brief description"
        />
      </div>
      <div>
        <label className="cyber-label">File</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-slate-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-600/20 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-400 hover:file:bg-emerald-600/30"
          required
        />
      </div>
      {file ? (
        <p className="text-xs text-slate-500">
          {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
        </p>
      ) : null}
      <button
        type="submit"
        disabled={uploading || !file || !title.trim()}
        className="rounded-lg border-2 border-emerald-600 bg-transparent px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-[0.18em] text-emerald-500 transition-all hover:bg-emerald-600/10 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Document"}
      </button>
      {result ? (
        <div className={`rounded-lg border px-4 py-3 text-sm ${result.ok ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-red-500/20 bg-red-500/10 text-red-300"}`}>
          {result.ok ? "Document uploaded successfully." : result.error}
        </div>
      ) : null}
    </form>
  );
}
