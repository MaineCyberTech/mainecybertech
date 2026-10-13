"use client";

import { cn } from "@mct/ui/lib/cn";

export interface ChipProps {
  /** Visible chip text; also the source of the remove button's accessible name. */
  label: string;
  onRemove?: () => void;
  /** Override the remove button's accessible name (defaults to `Remove <label>`). */
  removeLabel?: string;
  className?: string;
}

/**
 * Filter chip with an optional remove control. The remove button is a 24x24
 * target (WCAG 2.5.8) and always carries an accessible name, so the glyph
 * alone is never exposed to assistive tech.
 */
export function Chip({ label, onRemove, removeLabel, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300",
        className,
      )}
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `Remove ${label}`}
          className="-my-1 -mr-1 ml-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-200"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      ) : null}
    </span>
  );
}
