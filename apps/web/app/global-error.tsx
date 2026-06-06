"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - Maine CyberTech Portal</title>
      </head>
      <body style={{ margin: 0, padding: 0, minHeight: "100vh", backgroundColor: "#0A1118", color: "#E2E8F0", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ maxWidth: "400px", textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#F87171" }}>Something went wrong</h1>
          <p style={{ color: "#94A3B8", marginBottom: "2rem" }}>
            We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#059669",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {process.env.NODE_ENV === "development" && (
            <details style={{ marginTop: "2rem", textAlign: "left", color: "#64748B", fontSize: "0.875rem" }}>
              <summary>Error details (development only)</summary>
              <pre style={{ marginTop: "1rem", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  );
}
