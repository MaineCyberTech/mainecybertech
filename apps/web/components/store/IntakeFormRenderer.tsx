"use client";

import { useState, useEffect, useRef } from "react";
import { submitLead } from "../../app/(public)/contact/actions";
import TrustBadgeList from "./TrustBadgeList";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface IntakeField {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "url";
  required: boolean;
  help?: string;
  options?: string[];
}

interface IntakeFormRendererProps {
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  fields: IntakeField[];
}

export default function IntakeFormRenderer({
  productId,
  productName,
  productSlug,
  categoryName,
  fields,
}: IntakeFormRendererProps) {
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/public/init`)
      .then((r) => r.json())
      .then((d) => {
        setTrackingId(d.data.trackingId);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current) return;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      if (f.required && !values[f.id]?.trim()) {
        errs[f.id] = "Required";
      }
      if (
        f.type === "email" &&
        values[f.id]?.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[f.id])
      ) {
        errs[f.id] = "Valid email required";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function extract(fieldIds: string[]): string {
    for (const id of fieldIds) {
      if (values[id]?.trim()) return values[id].trim();
    }
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !trackingId) return;

    setSubmitting(true);
    setStatus(null);

    const name = extract(["name", "full_name", "contact_name"]) || "Store Inquiry";
    const email = extract(["email", "work_email", "email_address"]);
    const phone = extract(["phone", "phone_number", "tel"]);
    const company =
      extract(["company", "company_name", "business_name", "organization"]) || productName;

    const fieldData: Record<string, string> = {};
    for (const f of fields) {
      if (values[f.id]?.trim()) {
        fieldData[f.id] = values[f.id].trim();
      }
    }

    const message = JSON.stringify({
      productId,
      productName,
      productSlug,
      category: categoryName,
      fields: fieldData,
      source: "store-intake",
      submittedAt: new Date().toISOString(),
    });

    try {
      const res = await submitLead({
        trackingId,
        company,
        name,
        email,
        phone,
        services: categoryName,
        employees: "",
        urgency: "Medium - Planning Phase",
        message,
        consent,
        captchaToken: captchaToken || undefined,
      });

      if (res.success) {
        setStatus({
          type: "success",
          message: `Thank you for your interest in ${productName}. A member of our team will follow up with you shortly.`,
        });
        setValues({});
        setConsent(false);
      } else {
        setStatus({
          type: "error",
          message: res.error || "Submission failed. Please try again.",
        });
      }
    } catch {
      setStatus({
        type: "error",
        message: "There was a communication error. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function update(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    if (errors[id])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
  }

  const inputCls = (fieldId: string) =>
    `w-full rounded border border-white/10 bg-[#0A1118]/60 px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-emerald-600 focus:bg-[#0A1118]/90 focus:shadow-[0_0_10px_rgba(5,150,105,0.2)] ${errors[fieldId] ? "border-red-500" : ""}`;

  const labelCls = "mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-300";

  function renderField(field: IntakeField) {
    const { id, label, type, required, help, options } = field;
    const commonValue = values[id] || "";

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => update(id, e.target.value);

    let input: React.ReactNode;

    if (type === "textarea") {
      input = (
        <textarea
          id={id}
          rows={4}
          value={commonValue}
          onChange={handleChange}
          className={inputCls(id)}
        />
      );
    } else if (type === "select" && options) {
      input = (
        <select id={id} value={commonValue} onChange={handleChange} className={inputCls(id)}>
          <option value="" disabled>
            Select {label.toLowerCase()}...
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    } else {
      const htmlType = type === "url" ? "url" : type === "number" ? "number" : type;
      input = (
        <input
          id={id}
          type={htmlType}
          value={commonValue}
          onChange={handleChange}
          className={inputCls(id)}
        />
      );
    }

    return (
      <div key={id}>
        <label htmlFor={id} className={labelCls}>
          {label}
          {required && <span className="ml-1 text-emerald-400">*</span>}
        </label>
        {input}
        {help && <p className="mt-1 text-xs text-slate-500">{help}</p>}
        {errors[id] && <p className="mt-1 text-xs text-red-400">{errors[id]}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="intake-widget space-y-5">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="product_slug" value={productSlug} />
      <input type="hidden" name="category" value={categoryName} />
      <input type="hidden" name="source" value="store-intake" />

      <TrustBadgeList surface="intake_form" />

      <div className="rounded border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-400">
        <strong className="block text-xs font-bold uppercase tracking-wider">
          Security Notice
        </strong>
        Do not paste passwords, MFA codes, API keys, recovery codes, seed phrases, private keys,
        payment card data, or regulated records.
      </div>

      {fields.map(renderField)}

      {TURNSTILE_SITE_KEY && (
        <div className="flex items-start gap-3">
          <div
            ref={turnstileRef}
            className="cf-turnstile"
            data-sitekey={TURNSTILE_SITE_KEY}
            data-callback={(token: string) => setCaptchaToken(token)}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        <input
          id="intake-consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border border-white/10 bg-[#0A1118]/60 text-emerald-600 focus:ring-emerald-600"
        />
        <label htmlFor="intake-consent" className="text-xs leading-relaxed text-slate-400">
          I agree to the{" "}
          <a
            href="/privacy"
            className="text-emerald-400 underline transition hover:text-emerald-300"
          >
            Privacy Policy
          </a>{" "}
          and consent to my data being processed.
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || submitting || !consent || (!!TURNSTILE_SITE_KEY && !captchaToken)}
        className="font-orbitron w-full rounded border-2 border-emerald-600 bg-emerald-600 px-6 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-400 disabled:shadow-none"
      >
        {loading
          ? "Establishing Secure Connection..."
          : submitting
            ? "Processing Request..."
            : "Submit Request"}
      </button>

      {status && (
        <div
          className={`rounded border p-4 text-sm font-medium ${
            status.type === "success"
              ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-500"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {status.message}
        </div>
      )}
    </form>
  );
}
