"use client";

import { useState, useRef, type DragEvent } from "react";

type Props = {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
};

export default function FileDropzone({ onFilesSelected, accept, maxSizeMB = 100, multiple = true, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFiles(files: FileList | File[]) {
    setError(null);
    const valid: File[] = [];
    for (const file of Array.from(files)) {
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        setError(`"${file.name}" exceeds the ${maxSizeMB}MB size limit.`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0 && error) return;
    if (valid.length > 0) onFilesSelected(valid);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) validateFiles(e.dataTransfer.files);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleClick() {
    if (!disabled) inputRef.current?.click();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) validateFiles(e.target.files);
  }

  return (
    <div className="space-y-2">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition ${
          dragging ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 bg-[#0A1118]/40 hover:border-emerald-600/30"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleInputChange} className="hidden" disabled={disabled} />
        <svg className="mx-auto h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4m-4 12H5a2 2 0 01-2-2V6a2 2 0 012-2h4" />
        </svg>
        <p className="mt-3 text-sm text-slate-400">
          {dragging ? "Drop files here" : "Drag & drop files here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Maximum file size: {maxSizeMB}MB{multiple ? ". Multiple files allowed." : ""}
        </p>
      </div>
      {error ? (
        <div className="rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>
      ) : null}
    </div>
  );
}
