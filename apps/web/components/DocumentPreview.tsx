"use client";

type Props = {
  url: string;
  mimeType?: string | null;
  fileName?: string | null;
  className?: string;
};

export default function DocumentPreview({ url, mimeType, fileName, className = "" }: Props) {
  const mime = mimeType?.toLowerCase() ?? "";
  const ext = (fileName?.split(".").pop() ?? "").toLowerCase();

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return (
      <div className={`overflow-hidden rounded-lg border border-white/10 ${className}`}>
        <img src={url} alt={fileName ?? "Preview"} className="h-auto max-h-96 w-full object-contain bg-[#071018]" />
      </div>
    );
  }

  if (mime === "application/pdf" || ext === "pdf") {
    return (
      <div className={`overflow-hidden rounded-lg border border-white/10 ${className}`}>
        <iframe src={url} className="h-96 w-full" title={fileName ?? "PDF Preview"} />
      </div>
    );
  }

  if (mime.startsWith("video/") || ["mp4", "webm", "ogg"].includes(ext)) {
    return (
      <div className={`overflow-hidden rounded-lg border border-white/10 ${className}`}>
        <video controls className="h-auto max-h-96 w-full bg-[#071018]">
          <source src={url} type={mime || undefined} />
        </video>
      </div>
    );
  }

  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac"].includes(ext)) {
    return (
      <div className={`rounded-lg border border-white/10 bg-[#0A1118]/60 p-6 ${className}`}>
        <audio controls className="w-full" src={url} />
      </div>
    );
  }

  if (mime.includes("text/") || ["txt", "csv", "json", "xml", "md", "log", "yaml", "yml"].includes(ext)) {
    return (
      <div className={`overflow-hidden rounded-lg border border-white/10 ${className}`}>
        <iframe src={url} className="h-64 w-full" title={fileName ?? "Text Preview"} />
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-center text-amber-300 ${className}`}>
      <p className="text-sm">Preview not available for this file type.</p>
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-emerald-400 hover:text-emerald-300 underline">
        Download to view
      </a>
    </div>
  );
}
