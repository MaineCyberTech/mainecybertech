"use client";

import { Fragment, ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@mct/ui/lib/cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Accessible name for dialogs rendered without a visible `title`. */
  ariaLabel?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  ariaLabel,
  children,
  size = "md",
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    if (!node) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
    const initialFocus =
      node.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select') ??
      focusables()[0];
    if (initialFocus) {
      initialFocus.focus();
    } else {
      node.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChangeRef.current(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    node.addEventListener("keydown", onKeyDown);
    return () => {
      node.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  };

  return (
    <Fragment>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#0A1118]/95 shadow-[0_25px_50px_rgba(0,0,0,0.5)] backdrop-blur-md",
            "animate-in slide-in-from-bottom-4 zoom-in-95 duration-200",
            sizeStyles[size],
          )}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          {(title || description) && (
            <div className="flex items-start justify-between border-b border-white/5 p-5 pr-12 sm:p-6 sm:pr-12">
              <div>
                {title && (
                  <h2 id={titleId} className="cyber-heading text-lg sm:text-xl">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descriptionId} className="cyber-subtext mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
          )}
          <div className={cn("p-5 sm:p-6", !title && !description && "pt-12")}>{children}</div>
        </div>
      </div>
    </Fragment>
  );
}
