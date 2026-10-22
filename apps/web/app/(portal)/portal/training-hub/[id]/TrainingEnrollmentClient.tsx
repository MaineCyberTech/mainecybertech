"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getClientApi } from "@/lib/client-api";

export default function TrainingEnrollmentClient({
  courseId,
  initialProgress,
  enrolled,
}: {
  courseId: string;
  initialProgress: number;
  enrolled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = (fn: () => Promise<unknown>, success: string) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await fn();
        setMessage(success);
        router.refresh();
      } catch {
        setError("Action failed. Please try again.");
      }
    });
  };

  if (!enrolled) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() => getClientApi().trainingHub.courses.enroll(courseId), "Enrolled.")
          }
          className="cyber-button"
        >
          {pending ? "Enrolling…" : "Start course"}
        </button>
        {error ? (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-200">Your progress</p>
        <p className="text-sm text-emerald-400">{progress}%</p>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={progress}
        onChange={(event) => setProgress(Number(event.target.value))}
        className="w-full accent-emerald-500"
        aria-label="Course progress"
      />
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            () => getClientApi().trainingHub.courses.progress(courseId, progress),
            progress >= 100 ? "Course completed." : "Progress saved.",
          )
        }
        className="cyber-button-secondary"
      >
        {pending ? "Saving…" : "Save progress"}
      </button>
      {message ? (
        <p role="status" className="text-sm text-emerald-400">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
