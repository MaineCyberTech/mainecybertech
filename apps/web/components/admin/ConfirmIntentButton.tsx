"use client";

import * as React from "react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type ConfirmIntentButtonProps = {
  label?: string;
  name?: string;
  value?: string;
  confirmMessage?: string;
  className?: string;
  iconOnly?: boolean;
  title?: string;
};

export default function ConfirmIntentButton({
  label = "Delete",
  name = "intent",
  value = "delete",
  confirmMessage = "Are you sure? This action cannot be undone.",
  className,
  iconOnly = false,
  title,
}: ConfirmIntentButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <button
        ref={buttonRef}
        type="submit"
        name={name}
        value={value}
        title={title ?? label}
        aria-label={title ?? label}
        className={cn("inline-flex items-center justify-center", className)}
        onClick={(event) => {
          // Replace native window.confirm with an accessible dialog, then
          // re-submit the form with this button as the submitter so its
          // name/value (the intent) is included.
          event.preventDefault();
          setConfirmOpen(true);
        }}
      >
        <span className="inline-flex items-center gap-2">
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
          {!iconOnly ? <span>{label}</span> : null}
        </span>
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmMessage}
        body="This action cannot be undone."
        confirmLabel={label}
        danger
        onConfirm={() => {
          setConfirmOpen(false);
          const button = buttonRef.current;
          button?.form?.requestSubmit(button);
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
