"use client";

import { Fragment, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@mct/ui/lib/cn";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
}: DialogProps) {
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
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        aria-describedby={description ? "dialog-description" : undefined}
      >
        <div
          className={cn(
            "w-full bg-[#0A1118]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.5)] overflow-hidden",
            "animate-in slide-in-from-bottom-4 zoom-in-95 duration-200",
            sizeStyles[size],
          )}
        >
          {(title || description) && (
            <div className="flex items-start justify-between border-b border-white/5 p-5 sm:p-6">
              <div>
                {title && (
                  <h2
                    id="dialog-title"
                    className="cyber-heading text-lg sm:text-xl"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="dialog-description" className="mt-1 cyber-subtext">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="p-5 sm:p-6">{children}</div>
        </div>
      </div>
    </Fragment>
  );
}
