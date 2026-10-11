import { docVisibility, visibilityClass } from "./helpers";
import { VISIBILITY_OPTIONS, type DocumentRecord, type VisibilityValue } from "./types";

export default function InlineVisibilityEditor({
  doc,
  editing,
  onStart,
  onCommit,
  onCancel,
  disabled,
}: {
  doc: DocumentRecord;
  editing: boolean;
  onStart: (doc: DocumentRecord) => void;
  onCommit: (doc: DocumentRecord, visibility: VisibilityValue) => void;
  onCancel: () => void;
  disabled: boolean;
}) {
  if (!editing) {
    return (
      <button
        type="button"
        className={visibilityClass(docVisibility(doc))}
        onClick={() => onStart(doc)}
        disabled={disabled}
      >
        {docVisibility(doc)}
      </button>
    );
  }
  return (
    <select
      autoFocus
      aria-label="Document visibility"
      className="cyber-input h-10 min-w-[140px]"
      defaultValue={docVisibility(doc)}
      onBlur={() => onCancel()}
      onChange={(e) => {
        onCommit(doc, e.target.value as VisibilityValue);
      }}
      disabled={disabled}
    >
      {VISIBILITY_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
