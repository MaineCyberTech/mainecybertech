"use server";

import { getClientEnv } from "@/lib/env";
import { CONSENT_VERSION } from "@/lib/consent";

const API_BASE = getClientEnv().NEXT_PUBLIC_API_URL;

export async function submitLead(data: {
  trackingId: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  services: string;
  employees: string;
  urgency: string;
  message: string;
  consent: boolean;
  captchaToken?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.consent) {
      return { success: false, error: "You must consent to the Privacy Policy." };
    }

    // PRIV-P2-001 / PRIV-P2-002: `consent` (and the policy version) is
    // forwarded so the API persists the decision server-side on the
    // interaction row (previously it was browser-only).
    const res = await fetch(`${API_BASE}/api/v1/public/submit`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, consentVersion: String(CONSENT_VERSION) }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || "Submission failed" };
    return { success: true };
  } catch {
    return { success: false, error: "Could not reach the server. Please try again." };
  }
}
