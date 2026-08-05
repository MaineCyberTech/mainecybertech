"use client";

import { useRef, useState } from "react";

export default function UploadForm({
  token,
  apiUrl,
  maxFileSizeMb,
}: {
  token: string;
  apiUrl: string;
  maxFileSizeMb: number | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    if (maxFileSizeMb && file.size > maxFileSizeMb * 1024 * 1024) {
      setError(`File exceeds the ${maxFileSizeMb}MB limit.`);
      return;
    }
    setPending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${apiUrl}/api/v1/file-requests/public/${token}/upload`, {
        method: "POST",
        body: fd,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error?.message ?? `Upload failed (${res.status}).`);
      } else {
        setSuccess(`"${file.name}" uploaded successfully. Thank you!`);
        if (inputRef.current) inputRef.current.value = "";
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        required
        aria-label="Choose file"
        className="block w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2.5 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-emerald-500"
      />
      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {success}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Uploading..." : "Upload File"}
      </button>
    </form>
  );
}
