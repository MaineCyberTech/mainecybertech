"use client";

import { useState } from "react";
import { getClientApi } from "@/lib/client-api";

export default function EmailTestClient() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const clientApi = getClientApi();
      await (clientApi as any).client.post("/api/v1/admin/test-email", {
        to: email,
      });
      setResult({ ok: true, message: "Test email sent successfully!" });
    } catch (err: any) {
      setResult({
        ok: false,
        message: err?.message || "Failed to send test email",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Send test email to
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
          className="w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={sending || !email}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Test Email"}
      </button>
      {result && (
        <div
          className={`rounded-lg p-3 text-sm ${
            result.ok
              ? "bg-emerald-900/30 text-emerald-300"
              : "bg-red-900/30 text-red-300"
          }`}
        >
          {result.message}
        </div>
      )}
    </form>
  );
}
