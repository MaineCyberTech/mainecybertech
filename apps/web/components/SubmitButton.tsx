"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/**
 * Submit button for native `action={serverAction}` forms. Reads the pending
 * state from `useFormStatus` so server-action forms get a busy/disabled state
 * without hand-rolling `useState` in every component.
 */
export default function SubmitButton({
  children,
  pendingText = "Saving…",
  className,
  title,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      title={title}
      className={
        className ? `${className} disabled:cursor-not-allowed disabled:opacity-60` : undefined
      }
    >
      {pending ? pendingText : children}
    </button>
  );
}
