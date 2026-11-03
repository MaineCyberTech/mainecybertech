"use client";

import { useState, useTransition, type ReactNode } from "react";

type RequestActionResult = { ok: boolean; error?: string };
type RequestAction = (formData: FormData) => Promise<RequestActionResult | void>;

/**
 * Client wrapper for portal request-creation forms (USE-P3-008).
 *
 * The server actions return `{ ok: false, error }` for validation/API failures
 * instead of throwing, so the form can show the message inline (role="alert")
 * and keep the typed values. A thrown redirect is re-thrown for Next.js to
 * handle; any other rejection is surfaced as a generic inline error rather than
 * replacing the page with the portal error boundary.
 */
export default function PortalRequestForm({
  action,
  className,
  children,
}: {
  action: RequestAction;
  className?: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    setError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result && !result.ok) {
          setError(result.error ?? "Request failed. Please try again.");
        }
      } catch (err) {
        // redirect() uses NEXT_REDIRECT control flow; let Next navigate.
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        setError(err instanceof Error ? err.message : "Request failed. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={className} aria-busy={pending}>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </form>
  );
}
