"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

export type ToastTone = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  tone: ToastTone;
  message: string;
  title?: string;
};

type ToastContextValue = {
  toasts: Toast[];
  pushToast: (tone: ToastTone, message: string, title?: string) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function toastClass(tone: ToastTone) {
  if (tone === "success") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (tone === "warning") return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  if (tone === "error") return "border-red-500/20 bg-red-500/10 text-red-200";
  return "border-blue-500/20 bg-blue-500/10 text-blue-200";
}

const AUTO_DISMISS_MS = 5000;

const TOAST_VIEWPORT_CLASSES =
  "pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3";

function dismissLabel(toast: Toast) {
  const text = toast.title ?? toast.message;
  const truncated = text.length > 60 ? `${text.slice(0, 60)}…` : text;
  return `Dismiss ${truncated}`;
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_20px_50px_rgba(2,6,23,0.30)] backdrop-blur ${toastClass(toast.tone)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
          <p className={`text-sm opacity-90 ${toast.title ? "mt-1" : ""}`}>{toast.message}</p>
        </div>
        <button
          type="button"
          aria-label={dismissLabel(toast)}
          className="-mr-1 -mt-1 shrink-0 rounded-md p-1 opacity-70 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-0"
          onClick={() => onDismiss(toast.id)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback((tone: ToastTone, message: string, title?: string) => {
    nextId.current += 1;
    const id = `${Date.now()}-${nextId.current}`;
    setToasts((current) => [...current, { id, tone, message, title }]);
    const timer = setTimeout(() => {
      timers.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, AUTO_DISMISS_MS);
    timers.current.set(id, timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ toasts, pushToast, dismiss }), [toasts, pushToast, dismiss]);

  const politeToasts = toasts.filter((toast) => toast.tone !== "error");
  const errorToasts = toasts.filter((toast) => toast.tone === "error");

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={TOAST_VIEWPORT_CLASSES}>
        <div role="status" aria-live="polite" className="flex flex-col gap-3">
          {politeToasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
        <div role="alert" aria-live="assertive" className="flex flex-col gap-3">
          {errorToasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
