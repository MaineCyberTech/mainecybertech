"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitChangeRequestAction } from "../actions";

export default function SubmitChangeButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await submitChangeRequestAction(id);
            if (!result.ok) setError(result.error ?? "Failed to submit");
            else router.refresh();
          })
        }
        className="cyber-button"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
