"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type AdminListPageSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
};

export default function AdminListPageSearch({
  value,
  onChange,
  placeholder = "Search…",
  debounceMs,
  className,
}: AdminListPageSearchProps) {
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function handleChange(next: string) {
    setLocal(next);
    if (debounceMs && debounceMs > 0) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onChange(next), debounceMs);
    } else {
      onChange(next);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      >
        <path
          d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16Zm6.5-1.5L19 19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input
        type="search"
        value={local}
        placeholder={placeholder}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-cyber-base py-2 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/40 focus:outline-none"
      />
    </div>
  );
}
