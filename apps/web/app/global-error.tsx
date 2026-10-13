"use client";

import { useEffect } from "react";
import Link from "next/link";
import { colors } from "@mct/ui/tokens";
import { logoutAction } from "@/lib/auth/auth-actions";
import { clientLogger } from "@/lib/client-logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    clientLogger.errorWithContext(
      { area: "global", digest: error.digest },
      error,
    );
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - Maine CyberTech Portal</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          backgroundColor: colors.cyber.base,
          color: colors.slate[200],
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{ maxWidth: "400px", textAlign: "center", padding: "2rem" }}
        >
          <h1
            style={{ fontSize: "2rem", marginBottom: "1rem", color: colors.red[400] }}
          >
            Something went wrong
          </h1>
          <p style={{ color: colors.slate[400], marginBottom: "2rem" }}>
            We encountered an unexpected error. Please try refreshing the page
            or contact support if the problem persists.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                backgroundColor: colors.cyber.accent,
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
            <form action={logoutAction}>
              <button
                type="submit"
                style={{
                  backgroundColor: colors.slate[800],
                  color: colors.slate[200],
                  border: `1px solid ${colors.slate[700]}`,
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Log out
              </button>
            </form>
            <Link
              href="/login"
              style={{
                backgroundColor: "transparent",
                color: colors.slate[400],
                border: `1px solid ${colors.slate[700]}`,
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Back to login
            </Link>
          </div>
          <details
            style={{
              marginTop: "2rem",
              textAlign: "left",
              color: colors.slate[500],
              fontSize: "0.875rem",
            }}
          >
            <summary>Error details</summary>
            <pre
              style={{
                marginTop: "1rem",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        </div>
      </body>
    </html>
  );
}
