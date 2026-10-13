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

  // FILE-P3-008: SVG is active content and the server rejects it for uploads;
  // never treat it (or a bare .svg name) as a previewable image.
  const isSvg = mime === "image/svg+xml" || ext === "svg";

  if (!isSvg && (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext))) {
    return (
      <div className={`overflow-hidden rounded-lg border border-white/10 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={fileName ?? "Preview"}
          className="h-auto max-h-96 w-full bg-cyber-card-deep object-contain"
        />
      </div>
    );
  }

  if (mime === "application/pdf" || ext === "pdf") {
    return (
      <div className={`overflow-hidden rounded-lg border border-white/10 ${className}`}>
        {/* FILE-P3-008: fully sandboxed — no scripts, no same-origin access. */}
        <iframe
          src={url}
          sandbox=""
          className="h-96 w-full"
          title={fileName ?? "PDF Preview"}
        />
      </div>
    );
  }

  if (mime.startsWith("video/") || ["mp4", "webm", "ogg"].includes(ext)) {
    return (
      <div className={`overflow-hidden rounded-lg border border-white/10 ${className}`}>
        <video controls className="h-auto max-h-96 w-full bg-cyber-card-deep">
          <source src={url} type={mime || undefined} />
        </video>
      </div>
    );
  }

  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac"].includes(ext)) {
    return (
      <div className={`rounded-lg border border-white/10 bg-cyber-base/60 p-6 ${className}`}>
        <audio controls className="w-full" src={url} />
      </div>
    );
  }

  if (
    mime.includes("text/") ||
    ["txt", "csv", "json", "xml", "md", "log", "yaml", "yml"].includes(ext)
  ) {
    return (
      <div className={`overflow-hidden rounded-lg border border-white/10 ${className}`}>
        {/* FILE-P3-008: fully sandboxed — text-ish content must never run
            scripts or reach the portal origin from the storage document. */}
        <iframe src={url} sandbox="" className="h-64 w-full" title={fileName ?? "Text Preview"} />
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-center text-amber-300 ${className}`}
    >
      <p className="text-sm">Preview not available for this file type.</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-xs text-emerald-400 underline hover:text-emerald-300"
      >
        Download to view
      </a>
    </div>
  );
}
