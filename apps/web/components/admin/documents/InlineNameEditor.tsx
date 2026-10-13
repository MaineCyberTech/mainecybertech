import { docName } from "./helpers";
import type { DocumentRecord } from "./types";

export default function InlineNameEditor({
  doc,
  editing,
  value,
  onChangeValue,
  onStart,
  onCommit,
  onCancel,
  disabled,
}: {
  doc: DocumentRecord;
  editing: boolean;
  value: string;
  onChangeValue: (value: string) => void;
  onStart: (doc: DocumentRecord) => void;
  onCommit: (doc: DocumentRecord) => void;
  onCancel: () => void;
  disabled: boolean;
}) {
  if (!editing) {
    return (
      <button
        type="button"
        className="font-medium text-slate-50 hover:text-emerald-300"
        onClick={() => onStart(doc)}
        disabled={disabled}
      >
        {docName(doc)}
      </button>
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChangeValue(e.target.value)}
      onBlur={() => onCommit(doc)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit(doc);
        }
        if (e.key === "Escape") onCancel();
      }}
      aria-label="Rename document"
      className="cyber-input h-10"
      autoFocus
      disabled={disabled}
    />
  );
}
