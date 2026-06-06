"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

export default class SentryErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string | null }) {
    try {
      const Sentry = require("@sentry/browser");
      Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A1118] p-8">
          <div className="max-w-md rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
            <h1 className="font-orbitron text-xl uppercase tracking-[0.12em] text-red-300">Something went wrong</h1>
            <p className="mt-4 text-sm text-slate-400">
              An unexpected error occurred. The error has been reported.
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="mt-6 rounded-lg border-2 border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
