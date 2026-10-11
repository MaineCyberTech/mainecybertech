import { docName, fileType } from "./helpers";
import type { DocumentRecord } from "./types";

export default function FileThumb({
  doc,
  large = false,
}: {
  doc: DocumentRecord;
  large?: boolean;
}) {
  const type = fileType(doc);
  const size = large ? "h-36 w-full" : "h-14 w-14";
  if (type === "Image" && doc.resolved_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={doc.resolved_url}
        alt={docName(doc)}
        className={`${size} rounded-xl object-cover ring-1 ring-white/10`}
      />
    );
  }
  const label =
    type === "Spreadsheet"
      ? "XL"
      : type === "Document"
        ? "DOC"
        : type === "Markdown"
          ? "MD"
          : type === "Unknown"
            ? "FILE"
            : type;
  return (
    <div
      className={`flex ${size} items-center justify-center rounded-xl border border-white/10 bg-cyber-card-deep/80 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300 ring-1 ring-white/5`}
    >
      {label}
    </div>
  );
}
