"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Submit button for native `action={serverAction}` forms. Reads the pending
 * state from `useFormStatus` so server-action forms get a busy/disabled state
 * without hand-rolling `useState` in every component. Extra button props
 * (name/value/aria-label/data-*) are forwarded.
 */
export default function SubmitButton({
  children,
  pendingText = "Saving…",
  className,
  ...rest
}: { children: ReactNode; pendingText?: string } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "disabled"
>) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      {...rest}
      className={
        className ? `${className} disabled:cursor-not-allowed disabled:opacity-60` : className
      }
    >
      {pending ? pendingText : children}
    </button>
  );
}
